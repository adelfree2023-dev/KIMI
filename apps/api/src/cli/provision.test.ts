import { describe, it, expect, vi, beforeEach } from 'vitest';
import { execSync } from 'child_process';
import { resolve } from 'path';

describe('Provisioning CLI', () => {
    const cliPath = resolve(import.meta.dirname, 'provision.ts');
    const env = {
        ...process.env,
        JWT_SECRET: 'test-secret-must-be-at-least-32-chars-long',
        DATABASE_URL: 'postgresql://localhost:5432/test',
        MINIO_ENDPOINT: 'localhost',
        MINIO_ACCESS_KEY: 'minioadmin',
        MINIO_SECRET_KEY: 'minioadmin',
        NODE_ENV: 'test'
    };

    it('should fail when missing required arguments', () => {
        try {
            execSync(`bun run ${cliPath}`, { stdio: 'pipe', env });
            // Should not reach here
            expect(true).toBe(false);
        } catch (error: any) {
            expect(error.status).toBe(1);
            expect(error.stderr.toString()).toContain('Missing required arguments');
        }
    });

    it('should show help when missing arguments', () => {
        try {
            execSync(`bun run ${cliPath}`, { stdio: 'pipe', env });
        } catch (error: any) {
            expect(error.stderr.toString()).toContain('Usage: bun run cli provision');
        }
    });
});
