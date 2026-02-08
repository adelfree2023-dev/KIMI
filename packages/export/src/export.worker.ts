/**
 * Export Worker
 * Processes export jobs from BullMQ queue
 * S2: Tenant isolation enforced
 * S4: Comprehensive audit logging
 */

import { Worker, Job } from 'bullmq';
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ExportStrategyFactory } from './export-strategy.factory.js';
import type { ExportOptions, ExportResult } from './types.js';
import { AuditService } from '@apex/audit';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { readFile } from 'fs/promises';

@Injectable()
export class ExportWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ExportWorker.name);
  private worker: Worker;
  private s3Client: S3Client;

  constructor(
    private readonly strategyFactory: ExportStrategyFactory,
    private readonly audit: AuditService,
  ) {
    // Initialize S3/MinIO client
    this.s3Client = new S3Client({
      endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
      region: process.env.MINIO_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || '',
        secretAccessKey: process.env.MINIO_SECRET_KEY || '',
      },
      forcePathStyle: true,
    });
  }

  onModuleInit() {
    // Start worker with concurrency 1 per tenant (handled by queue)
    this.worker = new Worker(
      'tenant-export',
      async (job) => this.processJob(job),
      {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
        concurrency: 3, // Process 3 exports simultaneously (different tenants)
        limiter: {
          max: 1, // 1 job
          duration: 1000, // per second
        },
      }
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Export job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Export job ${job?.id} failed:`, err);
    });

    this.logger.log('Export worker started');
  }

  onModuleDestroy() {
    this.worker?.close();
  }

  private async processJob(job: Job): Promise<ExportResult> {
    const { tenantId, profile, requestedBy, includeAssets, dateRange } = job.data;

    this.logger.log(`Processing export job ${job.id} for tenant ${tenantId}`);
    await job.updateProgress(10);

    try {
      // S4: Audit log - processing started
      await this.audit.log({
        action: 'EXPORT_PROCESSING_STARTED',
        entityType: 'EXPORT',
        entityId: job.id as string,
        tenantId,
        metadata: { profile, requestedBy },
      });

      // Get export strategy
      const strategy = this.strategyFactory.getStrategy(profile);
      await job.updateProgress(20);

      // Execute export
      const options: ExportOptions = {
        tenantId,
        profile,
        requestedBy,
        includeAssets,
        dateRange,
      };

      const result = await strategy.export(options);
      await job.updateProgress(70);

      // Upload to restricted bucket
      const bucketName = 'tenant-exports';
      const objectKey = `exports/${tenantId}/${job.id}.tar.gz`;

      // Ensure bucket exists
      await this.ensureBucket(bucketName);

      // Upload file
      const fileBuffer = await readFile(result.downloadUrl);
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
          Body: fileBuffer,
          ContentType: 'application/gzip',
          Metadata: {
            'tenant-id': tenantId,
            'export-id': job.id as string,
            'checksum': result.checksum,
          },
        })
      );

      await job.updateProgress(90);

      // Generate presigned URL (24h expiry)
      const presignedUrl = await getSignedUrl(
        this.s3Client,
        new GetObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
        }),
        { expiresIn: 24 * 60 * 60 }
      );

      // Schedule auto-delete after 24h
      await this.scheduleAutoDelete(bucketName, objectKey, 24 * 60 * 60);

      // Cleanup local file
      await Bun.spawn(['rm', '-f', result.downloadUrl]).exited.catch(() => {});

      await job.updateProgress(100);

      // S4: Audit log - completed
      await this.audit.log({
        action: 'EXPORT_COMPLETED',
        entityType: 'EXPORT',
        entityId: job.id as string,
        tenantId,
        metadata: {
          profile,
          sizeBytes: result.sizeBytes,
          checksum: result.checksum,
        },
      });

      this.logger.log(`Export job ${job.id} completed successfully`);

      return {
        ...result,
        downloadUrl: presignedUrl, // Replace local path with presigned URL
      };
    } catch (error) {
      // S4: Audit log - failed
      await this.audit.log({
        action: 'EXPORT_FAILED',
        entityType: 'EXPORT',
        entityId: job.id as string,
        tenantId,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  private async ensureBucket(bucketName: string): Promise<void> {
    try {
      // Check if bucket exists using head bucket
      await this.s3Client.send(
        new (await import('@aws-sdk/client-s3')).HeadBucketCommand({
          Bucket: bucketName,
        })
      );
    } catch {
      // Create bucket if not exists
      await this.s3Client.send(
        new (await import('@aws-sdk/client-s3')).CreateBucketCommand({
          Bucket: bucketName,
        })
      );

      // Set lifecycle policy for auto-deletion
      await this.s3Client.send(
        new (await import('@aws-sdk/client-s3')).PutBucketLifecycleConfigurationCommand({
          Bucket: bucketName,
          LifecycleConfiguration: {
            Rules: [
              {
                ID: 'export-auto-delete',
                Status: 'Enabled',
                Expiration: {
                  Days: 1,
                },
                Filter: {
                  Prefix: 'exports/',
                },
              },
            ],
          },
        })
      );
    }
  }

  private async scheduleAutoDelete(
    bucket: string,
    key: string,
    delaySeconds: number
  ): Promise<void> {
    // In production, use a delayed job queue or S3 lifecycle
    // For now, we'll rely on S3 lifecycle policy set above
    this.logger.debug(`Auto-delete scheduled for ${key} in ${delaySeconds}s`);
  }
}
