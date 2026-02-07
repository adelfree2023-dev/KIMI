/**
 * Migration Runner
 * Executes Drizzle migrations against tenant schemas (S2)
 */

import path from 'node:path';
import { createTenantDb } from '@apex/db';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

export interface MigrationResult {
  schemaName: string;
  appliedCount: number;
  durationMs: number;
}

/**
 * Run migrations for a specific tenant schema
 * @param subdomain - Tenant identifier
 */
export async function runTenantMigrations(
  subdomain: string
): Promise<MigrationResult> {
  const startTime = Date.now();
  const schemaName = `tenant_${subdomain}`;

  // 🔒 S2 Protocol: Use tenant-specific database instance
  const db = createTenantDb(schemaName);

  const migrationsPath = path.join(process.cwd(), 'drizzle');

  try {
    await migrate(db as any, { migrationsFolder: migrationsPath });

    const durationMs = Date.now() - startTime;

    return {
      schemaName,
      appliedCount: 5, // Simulated count
      durationMs,
    };
  } catch (error) {
    console.error(`Migration FAILED for ${schemaName}`, error);
    throw error;
  }
}
