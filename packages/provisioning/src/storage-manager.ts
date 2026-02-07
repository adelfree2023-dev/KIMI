import { env } from '@apex/shared-config';
import * as Minio from 'minio';
import { logger } from '@apex/logger';
import type { BucketCreationResult, StorageStats } from './types.js';

let minioClient: Minio.Client | null = null;

function getMinioClient(): Minio.Client {
  if (!minioClient) {
    minioClient = new Minio.Client({
      endPoint: env.MINIO_ENDPOINT,
      port: Number.parseInt(env.MINIO_PORT, 10),
      useSSL: env.MINIO_USE_SSL === 'true',
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
    });
  }
  return minioClient;
}

function sanitizeBucketName(subdomain: string): string {
  return `tenant-${subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;
}

export async function createStorageBucket(
  subdomain: string,
  plan = 'free'
): Promise<BucketCreationResult> {
  const start = Date.now();
  const bucketName = sanitizeBucketName(subdomain);
  const client = getMinioClient();

  try {
    const exists = await client.bucketExists(bucketName);
    if (exists) {
      return {
        success: false,
        error: 'Bucket already exists',
        bucketName,
      };
    }

    await client.makeBucket(bucketName, env.MINIO_REGION || 'us-east-1');

    // Set bucket policy based on plan
    const policy = plan === 'free'
      ? { version: '2012-10-17', statement: [] }
      : await getPublicReadPolicy(bucketName);

    await client.setBucketPolicy(bucketName, JSON.stringify(policy));

    logger.info(`Bucket created for tenant: ${subdomain}`, {
      bucketName,
      plan,
      duration: Date.now() - start,
    });

    return {
      success: true,
      bucketName,
      endpoint: `${env.MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}/${bucketName}`,
    };
  } catch (error) {
    logger.error('Failed to create storage bucket', { subdomain, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      bucketName,
    };
  }
}

export async function deleteStorageBucket(
  subdomain: string,
  force = false
): Promise<boolean> {
  const bucketName = sanitizeBucketName(subdomain);
  const client = getMinioClient();

  try {
    if (!force) {
      const objects = await client.listObjects(bucketName, '', true).toArray();
      if (objects.length > 0) {
        throw new Error('Bucket not empty. Use force=true to delete anyway.');
      }
    }

    await client.removeBucket(bucketName);
    logger.info(`Bucket deleted: ${bucketName}`);
    return true;
  } catch (error) {
    logger.error('Failed to delete bucket', { bucketName, error });
    return false;
  }
}

export async function getSignedUploadUrl(
  subdomain: string,
  objectName: string,
  expiry = 3600
): Promise<string> {
  const bucketName = sanitizeBucketName(subdomain);
  const client = getMinioClient();

  try {
    const url = await client.presignedPutObject(bucketName, objectName, expiry);
    return url;
  } catch (error) {
    logger.error('Failed to generate upload URL', { bucketName, objectName, error });
    throw new Error('Failed to generate upload URL');
  }
}

export async function getSignedDownloadUrl(
  subdomain: string,
  objectName: string,
  expiry = 3600
): Promise<string> {
  const bucketName = sanitizeBucketName(subdomain);
  const client = getMinioClient();

  try {
    const url = await client.presignedGetObject(bucketName, objectName, expiry);
    return url;
  } catch (error) {
    logger.error('Failed to generate download URL', { bucketName, objectName, error });
    throw new Error('Failed to generate download URL');
  }
}

export async function deleteObject(
  subdomain: string,
  objectName: string
): Promise<boolean> {
  const bucketName = sanitizeBucketName(subdomain);
  const client = getMinioClient();

  try {
    await client.removeObject(bucketName, objectName);
    return true;
  } catch (error) {
    logger.error('Failed to delete object', { bucketName, objectName, error });
    return false;
  }
}

export async function getStorageStats(subdomain: string): Promise<StorageStats> {
  const bucketName = sanitizeBucketName(subdomain);
  const client = getMinioClient();

  try {
    const objects = await client.listObjects(bucketName, '', true).toArray();
    const totalSize = objects.reduce((acc, obj) => acc + (obj.size || 0), 0);

    return {
      totalObjects: objects.length,
      totalSize,
      lastModified: objects.length > 0
        ? new Date(Math.max(...objects.map(o => new Date(o.lastModified || 0).getTime())))
        : null,
    };
  } catch (error) {
    logger.error('Failed to get storage stats', { bucketName, error });
    return { totalObjects: 0, totalSize: 0, lastModified: null };
  }
}

async function getPublicReadPolicy(bucketName: string): Promise<unknown> {
  return {
    version: '2012-10-17',
    statement: [
      {
        effect: 'Allow',
        principal: '*',
        action: ['s3:GetObject'],
        resource: [`arn:aws:s3:::${bucketName}/*`],
      },
    ],
  };
}