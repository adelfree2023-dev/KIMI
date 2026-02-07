/**
 * S2: Tenant Isolation Protocol
 * Schema-based isolation using Drizzle ORM
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { validateEnv } from '@apex/config';

const env = validateEnv();

// Connection pool for public schema (tenant management)
export const publicPool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Drizzle instance for public schema
export const publicDb = drizzle(publicPool);

/**
 * Get tenant-specific database connection
 * Sets search_path to isolate tenant data
 */
export function getTenantDb(tenantId: string) {
    const tenantSchema = `tenant_${tenantId}`;

    const pool = new Pool({
        connectionString: env.DATABASE_URL,
        ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    // Set search path for this connection
    pool.on('connect', (client) => {
        client.query(`SET search_path TO ${tenantSchema}, public`);
    });

    return drizzle(pool);
}

/**
 * Create tenant schema (used in provisioning)
 */
export async function createTenantSchema(tenantId: string): Promise<void> {
    const schemaName = `tenant_${tenantId}`;

    await publicPool.query(`
    CREATE SCHEMA IF NOT EXISTS "${schemaName}";
    GRANT ALL ON SCHEMA "${schemaName}" TO CURRENT_USER;
  `);
}

/**
 * Drop tenant schema (used in deletion/kill switch)
 */
export async function dropTenantSchema(tenantId: string): Promise<void> {
    const schemaName = `tenant_${tenantId}`;
    await publicPool.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
}
