/**
 * S2: Tenant Isolation Protocol
 * Schema-based isolation using Drizzle ORM
 */

import { validateEnv } from '@apex/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';

const { Pool } = pkg;

export * from './schema.js';

const env = validateEnv();

// S2 FIX: Explicitly pass credentials if parsed connectionString fails in some environments (e.g. Bun/Vitest in CI)
const poolConfig: any = {
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

// Manually reinforce if common env vars are present
if (process.env.POSTGRES_USER) poolConfig.user = process.env.POSTGRES_USER;
if (process.env.POSTGRES_PASSWORD) poolConfig.password = process.env.POSTGRES_PASSWORD;
if (process.env.POSTGRES_DB) poolConfig.database = process.env.POSTGRES_DB;

// Connection pool for public schema (tenant management)
export const publicPool = new Pool(poolConfig);

// Drizzle instance for public schema
export const publicDb = drizzle(publicPool);

/**
 * Verify tenant exists before allowing connection
 * S2: Prevents access to non-existent tenant schemas
 */
async function verifyTenantExists(tenantId: string): Promise<boolean> {
  try {
    // S1: safe - Querying tenants table via publicPool which uses public schema
    // This is required for S2 tenant isolation verification
    const result = await publicPool.query(
      'SELECT 1 FROM tenants WHERE id = $1 OR subdomain = $2 LIMIT 1',
      [tenantId, tenantId]
    );
    return (result.rowCount ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * Execute operation within tenant context using shared pool
 * S2: Verifies tenant validity before connection
 */
export async function withTenantConnection<T>(
  tenantId: string,
  operation: (db: any) => Promise<T>
): Promise<T> {
  // 🔒 S2 Enforcement: Verify tenant exists first
  const exists = await verifyTenantExists(tenantId);
  if (!exists) {
    throw new Error(`S2 Violation: Tenant '${tenantId}' not found or invalid`);
  }

  const client = await publicPool.connect();
  let cleanupSuccessful = false;

  try {
    // 🔒 S2 Enforcement: Switch to tenant context
    // Radical Fix: Sanitize tenantId and use quoted identifiers to prevent SQL injection or path escape
    const safeTenantId = tenantId.replace(/[^a-z0-9_-]/gi, '');
    await client.query(`SET search_path TO "tenant_${safeTenantId}", public`);

    const db = drizzle(client);
    const result = await operation(db);

    // S2 FIX: Reset context BEFORE returning result
    await client.query('SET search_path TO public');
    cleanupSuccessful = true;

    return result;
  } catch (error) {
    // S2 FIX: Attempt cleanup even on error
    try {
      await client.query('SET search_path TO public');
      cleanupSuccessful = true;
    } catch (cleanupError) {
      console.error('S2 CRITICAL: Failed to reset search_path after error', cleanupError);
    }
    throw error;
  } finally {
    // 🔒 S2 Protocol: Destroy connection if cleanup failed to prevent context leakage
    // client.release(true) destroys the connection instead of returning to pool
    client.release(!cleanupSuccessful);
  }
}

/**
 * Create a Drizzle instance for a specific tenant
 * Note: For production, use withTenantConnection for proper isolation.
 * This helper is for one-off operations like seeding.
 */
export function createTenantDb(_tenantId: string) {
  // In a real implementation, this would return a proxy or handle search_path
  // For now, we return publicDb but the caller must be aware or use withTenantConnection
  return publicDb;
}
