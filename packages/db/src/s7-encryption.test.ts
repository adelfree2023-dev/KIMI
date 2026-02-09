import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { publicPool } from './index';
import { EncryptionService } from '@apex/auth';

describe('S7: Encryption at Rest Protocol', () => {
    let encryptionService: EncryptionService;
    const testSecret = 'MY_SUPER_SECRET_PII_DATA';
    const masterKey = 'ValidTestKey32CharsWith1$!Abc1234';

    beforeAll(async () => {
        // 🔒 S7 CI Guard: Strict environment validation
        if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('undefined')) {
            console.error("🚨 SECURITY ALERT: Database connection string is invalid or missing password!");
            process.exit(1);
        }

        process.env.ENCRYPTION_MASTER_KEY = masterKey;
        process.env.NODE_ENV = 'test';
        encryptionService = new EncryptionService();

        // 🛠️ Setup: Ensure audit_logs table exists for testing storage
        await publicPool.query(`
      CREATE TABLE IF NOT EXISTS public.s7_test_storage (
        id SERIAL PRIMARY KEY,
        encrypted_data JSONB NOT NULL,
        plaintext_hint TEXT -- To verify we are NOT storing the secret here accidentally
      )
    `);
    });

    afterAll(async () => {
        // 🧹 Cleanup
        await publicPool.query('DROP TABLE IF EXISTS public.s7_test_storage');
    });

    it('should store data in encrypted format and NOT in plaintext', async () => {
        // 1. Encrypt data
        const encrypted = encryptionService.encrypt(testSecret);

        // 2. Persist to DB
        await publicPool.query(
            'INSERT INTO public.s7_test_storage (encrypted_data, plaintext_hint) VALUES ($1, $2)',
            [JSON.stringify(encrypted), 'PII_TYPE_SECRET']
        );

        // 3. Query RAW data from DB
        const result = await publicPool.query('SELECT encrypted_data FROM public.s7_test_storage LIMIT 1');
        const rawData = JSON.stringify(result.rows[0].encrypted_data);

        // 4. VERIFY: The secret string must NOT be present in the raw DB output
        expect(rawData).not.toContain(testSecret);
        expect(rawData).toContain(encrypted.encrypted);

        console.log('✅ S7: Verified secret is NOT present in raw database output');
    });

    it('should correctly decrypt data retrieved from database', async () => {
        const result = await publicPool.query('SELECT encrypted_data FROM public.s7_test_storage LIMIT 1');
        const storedEncrypted = result.rows[0].encrypted_data;

        // Decrypt
        const decrypted = encryptionService.decrypt(storedEncrypted);

        // VERIFY: Data is recovered correctly
        expect(decrypted).toBe(testSecret);
        console.log('✅ S7: Verified data recovery via EncryptionService');
    });

    it('should fail decryption with wrong master key (Integrity Check)', async () => {
        const result = await publicPool.query('SELECT encrypted_data FROM public.s7_test_storage LIMIT 1');
        const storedEncrypted = result.rows[0].encrypted_data;

        // Create a new service with a different key
        process.env.ENCRYPTION_MASTER_KEY = 'DifferentMasterKey32CharsLong!12';
        const wrongService = new EncryptionService();

        // Decryption should fail (or return garbage, but usually throws in GCM tag check)
        expect(() => wrongService.decrypt(storedEncrypted)).toThrow();

        console.log('✅ S7: Verified decryption failure with unauthorized key');
    });
});
