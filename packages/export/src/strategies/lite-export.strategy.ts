/**
 * Lite Export Strategy
 * Exports to portable formats (JSON, MySQL-compatible SQL)
 * Best for: Migration to other platforms, backups
 */

import { TenantRegistryService, publicPool } from '@apex/db';
import { Injectable, Logger } from '@nestjs/common';
import type {
  ExportManifest,
  ExportOptions,
  ExportResult,
  ExportStrategy,
} from '../types.js';

@Injectable()
export class LiteExportStrategy implements ExportStrategy {
  readonly name = 'lite' as const;
  private readonly logger = new Logger(LiteExportStrategy.name);

  constructor(private readonly tenantRegistry: TenantRegistryService) {}

  async validate(options: ExportOptions): Promise<boolean> {
    return this.tenantRegistry.exists(options.tenantId);
  }

  private readonly MAX_ROWS_PER_TABLE = 100000; // 100K rows limit

  async export(options: ExportOptions): Promise<ExportResult> {
    this.logger.log(`Starting lite export for tenant: ${options.tenantId}`);

    const schemaName = `tenant_${options.tenantId}`;
    const workDir = `/tmp/export-${options.tenantId}-${Date.now()}`;

    // Cleanup on any error
    const cleanup = async () => {
      await Bun.spawn(['rm', '-rf', workDir]).exited.catch(() => {});
      await Bun.spawn(['rm', '-f', `${workDir}.tar.gz`]).exited.catch(() => {});
    };

    // Create work directory
    await Bun.spawn(['mkdir', '-p', `${workDir}/database`]).exited;

    const client = await publicPool.connect();
    try {
      // S2: Get tables from tenant schema only
      const tablesResult = await client.query(
        `SELECT table_name FROM information_schema.tables 
         WHERE table_schema = $1 AND table_type = 'BASE TABLE'`,
        [schemaName]
      );

      const tables = tablesResult.rows.map(
        (r: { table_name: string }) => r.table_name
      );
      let totalRows = 0;

      // Export each table as JSON
      for (const table of tables) {
        this.logger.debug(`Exporting table: ${schemaName}.${table}`);

        // Check row count limit
        const countResult = await client.query(
          `SELECT COUNT(*) FROM ${schemaName}.${table}`
        );
        const rowCount = parseInt(countResult.rows[0].count);

        if (rowCount > this.MAX_ROWS_PER_TABLE) {
          throw new Error(
            `Table ${table} exceeds max rows (${rowCount} > ${this.MAX_ROWS_PER_TABLE})`
          );
        }

        const dataResult = await client.query(
          `SELECT * FROM ${schemaName}.${table}`
        );

        totalRows += dataResult.rowCount || 0;

        // Write to JSON file
        await Bun.write(
          `${workDir}/database/${table}.json`,
          JSON.stringify(dataResult.rows, null, 2)
        );
      }

      // Create manifest
      const manifest: ExportManifest = {
        tenantId: options.tenantId,
        exportedAt: new Date().toISOString(),
        profile: this.name,
        database: { tables, rowCount: totalRows, format: 'json' },
        assets: { files: [], totalSize: 0 },
        version: '1.0.0',
      };

      await Bun.write(
        `${workDir}/manifest.json`,
        JSON.stringify(manifest, null, 2)
      );

      // Compress
      const outputFile = `${workDir}.tar.gz`;
      await Bun.spawn(['tar', '-czf', outputFile, '-C', workDir, '.']).exited;

      // Calculate checksum
      const fileData = await Bun.file(outputFile).arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', fileData);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const checksumHex = hashArray
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      this.logger.log(`Lite export completed: ${outputFile}`);

      return {
        downloadUrl: outputFile,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        sizeBytes: (await Bun.file(outputFile).stat()).size,
        checksum: checksumHex,
        manifest,
      };
    } catch (error) {
      // Cleanup on any error
      await cleanup();
      throw error;
    } finally {
      client.release();
      // Cleanup work directory (keep tar.gz on success)
      await Bun.spawn(['rm', '-rf', workDir]).exited.catch(() => {});
    }
  }
}
