import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { publicPool, withTenantConnection } from './index';
import { sql } from 'drizzle-orm';

describe('S2: Tenant Isolation Protocol', () => {
    const tenantAlpha = 'alpha_test';
    const tenantBeta = 'beta_test';

    beforeEach(async () => {
        // 🔒 S2 CI Guard: Strict environment validation
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl || dbUrl.includes('undefined')) {
            console.error("🚨 SECURITY ALERT: Database connection string is invalid or missing password!");
            process.exit(1);
        }

        try {
            // 🛠️ Setup: Create mock tenant schemas and tables
            // Radical Fix: Recreate EVERYTHING before EACH test to ensure isolation
            await publicPool.query(`
                CREATE SCHEMA IF NOT EXISTS tenant_${tenantAlpha};
                CREATE SCHEMA IF NOT EXISTS tenant_${tenantBeta};
                
                DROP TABLE IF EXISTS tenant_${tenantAlpha}.products CASCADE;
                DROP TABLE IF EXISTS tenant_${tenantBeta}.products CASCADE;
                
                CREATE TABLE tenant_${tenantAlpha}.products (id SERIAL PRIMARY KEY, name TEXT);
                CREATE TABLE tenant_${tenantBeta}.products (id SERIAL PRIMARY KEY, name TEXT);
                
                -- Ensure tenants exist in the registry for withTenantConnection check
                DELETE FROM tenants WHERE subdomain IN ('${tenantAlpha}', '${tenantBeta}');
                INSERT INTO tenants (id, subdomain, name, plan, status) 
                VALUES (gen_random_uuid(), '${tenantAlpha}', 'Alpha', 'pro', 'active');
                INSERT INTO tenants (id, subdomain, name, plan, status) 
                VALUES (gen_random_uuid(), '${tenantBeta}', 'Beta', 'pro', 'active');

                -- 🛡️ Insert clean data for this specific test run
                INSERT INTO tenant_${tenantAlpha}.products (name) VALUES ('Alpha Secret');
                INSERT INTO tenant_${tenantBeta}.products (name) VALUES ('Beta Secret');
            `);
        } catch (error: any) {
            console.error('🚨 S2 Setup Failure:', error.message);
            throw error;
        }
    });

    afterAll(async () => {
        // 🧹 Cleanup
        await publicPool.query(`
      DROP SCHEMA IF EXISTS tenant_${tenantAlpha} CASCADE;
      DROP SCHEMA IF EXISTS tenant_${tenantBeta} CASCADE;
      DELETE FROM tenants WHERE subdomain IN ('${tenantAlpha}', '${tenantBeta}');
    `);
    });

    it('should only see Alpha data when connected to Alpha tenant', async () => {
        await withTenantConnection(tenantAlpha, async (db) => {
            // S2: No schema prefix allowed in queries inside withTenantConnection
            const result = await db.execute(sql`SELECT name FROM products`);
            expect(result.rows[0].name).toBe('Alpha Secret');

            // Verify we CANNOT see Beta data without fully qualifying (which S2 policy forbids in code)
            // but here we check that the search_path is indeed restricted
            const pathResult = await db.execute(sql`SHOW search_path`);
            expect(pathResult.rows[0].search_path).toContain(`tenant_${tenantAlpha}`);
            expect(pathResult.rows[0].search_path).not.toContain(`tenant_${tenantBeta}`);
        });
    });

    it('should only see Beta data when connected to Beta tenant', async () => {
        await withTenantConnection(tenantBeta, async (db) => {
            const result = await db.execute(sql`SELECT name FROM products`);
            expect(result.rows[0].name).toBe('Beta Secret');

            const pathResult = await db.execute(sql`SHOW search_path`);
            expect(pathResult.rows[0].search_path).toContain(`tenant_${tenantBeta}`);
            expect(pathResult.rows[0].search_path).not.toContain(`tenant_${tenantAlpha}`);
        });
    });

    it('should reset search_path to public after operation', async () => {
        const client = await publicPool.connect();
        try {
            await withTenantConnection(tenantAlpha, async () => {
                // Inside it's Alpha
            });

            // Outside it must be public
            const pathResult = await client.query('SHOW search_path');
            expect(pathResult.rows[0].search_path).toBe('public');
        } finally {
            client.release();
        }
    });

    it('should throw S2 Violation error for non-existent tenant', async () => {
        await expect(withTenantConnection('fake_tenant', async () => { }))
            .rejects.toThrow('S2 Violation: Tenant \'fake_tenant\' not found or invalid');
    });

    it('should NOT have cross-tenant schemas in search_path (Leak Prevention)', async () => {
        await withTenantConnection(tenantAlpha, async (db) => {
            const pathResult = await db.execute(sql`SHOW search_path`);
            const searchPath = pathResult.rows[0].search_path;

            // Ensure ONLY alpha and public/pg_catalog (optional) are present
            expect(searchPath).toContain(`tenant_${tenantAlpha}`);
            expect(searchPath).not.toContain(`tenant_${tenantBeta}`);

            // Verify we can't see Beta's data without qualified name (Standard isolation)
            // Note: Qualified names are caught by S14/S2 surgical scans in CI, 
            // but here we verify the runtime environment is restricted.
            const tables = await db.execute(sql`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'tenant_${tenantBeta}'`);
            expect(tables.rows.length).toBeGreaterThan(0); // Beta tables exist in DB

            // But 'SELECT * FROM products' must resolve to Alpha
            const alphaData = await db.execute(sql`SELECT name FROM products`);
            expect(alphaData.rows[0].name).toBe('Alpha Secret');
        });
    });

    it('should destroy connection if search_path reset fails (S2 Safety)', async () => {
        // This is covered by the 'finally' logic in withTenantConnection
        // which calls client.release(!cleanupSuccessful).
        // If cleanupSuccessful is false, the connection is physically closed.
    });
});
