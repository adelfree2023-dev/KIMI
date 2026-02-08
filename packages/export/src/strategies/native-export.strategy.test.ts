/**
 * Native Export Strategy Tests
 * Verifies PostgreSQL binary dump export
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NativeExportStrategy } from './native-export.strategy.js';
import type { ExportOptions } from '../types.js';

// Mock database
const mockClient = {
    query: vi.fn(),
    release: vi.fn(),
};

vi.mock('@apex/db', () => ({
    publicPool: {
        connect: vi.fn().mockResolvedValue(mockClient),
    },
}));

// Mock Bun
global.Bun = {
    spawn: vi.fn().mockReturnValue({
        exited: Promise.resolve(),
        stdout: {
            text: vi.fn().mockResolvedValue(''),
        },
    }),
    write: vi.fn().mockResolvedValue(undefined),
    file: vi.fn().mockReturnValue({
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
        stat: vi.fn().mockResolvedValue({ size: 2048 }),
    }),
} as any;

describe('NativeExportStrategy', () => {
    let strategy: NativeExportStrategy;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('Bun', {
            spawn: vi.fn().mockReturnValue({
                exited: Promise.resolve(0),
                stdout: {
                    text: vi.fn().mockResolvedValue(''),
                },
                stderr: {
                    text: vi.fn().mockResolvedValue(''),
                },
            }),
            write: vi.fn().mockResolvedValue(undefined),
            file: vi.fn().mockReturnValue({
                arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
                stat: vi.fn().mockResolvedValue({ size: 2048 }),
            }),
        });
        strategy = new NativeExportStrategy();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('validate', () => {
        it('should validate existing tenant', async () => {
            mockClient.query.mockResolvedValue({ rowCount: 1 });

            const options: ExportOptions = {
                tenantId: 'tenant-123',
                profile: 'native',
                requestedBy: 'user-456',
            };

            const result = await strategy.validate(options);
            expect(result).toBe(true);
        });

        it('should reject non-existent tenant', async () => {
            mockClient.query.mockResolvedValue({ rowCount: 0 });

            const options: ExportOptions = {
                tenantId: 'non-existent',
                profile: 'native',
                requestedBy: 'user-456',
            };

            const result = await strategy.validate(options);
            expect(result).toBe(false);
        });
    });

    describe('export', () => {
        it('should export using pg_dump with correct schema', async () => {
            const options: ExportOptions = {
                tenantId: 'tenant-123',
                profile: 'native',
                requestedBy: 'user-456',
            };

            const result = await strategy.export(options);

            expect(result).toBeDefined();
            expect(result.manifest.profile).toBe('native');
            expect(result.manifest.database.format).toBe('pg_dump');

            // Verify pg_dump was called with correct schema
            const spawnCalls = vi.mocked(Bun.spawn).mock.calls;
            const pgDumpCall = spawnCalls.find((call) =>
                Array.isArray(call[0]) && call[0].includes('pg_dump')
            );
            expect(pgDumpCall).toBeDefined();
            expect(pgDumpCall![0]).toContain('--schema=tenant_tenant-123');
            expect(pgDumpCall![0]).toContain('-Fc'); // Binary format
        });

        it('should enforce S2 tenant isolation in pg_dump', async () => {
            const options: ExportOptions = {
                tenantId: 'tenant-456',
                profile: 'native',
                requestedBy: 'user-789',
            };

            await strategy.export(options);

            const spawnCalls = vi.mocked(Bun.spawn).mock.calls;
            const pgDumpCall = spawnCalls.find((call) =>
                Array.isArray(call[0]) && call[0].includes('pg_dump')
            );

            // Verify only tenant schema is exported
            expect(pgDumpCall![0]).toContain('--schema=tenant_tenant-456');
            expect(pgDumpCall![0]).not.toContain('public');
        });

        it('should handle pg_dump failure', async () => {
            vi.mocked(Bun.spawn).mockReturnValueOnce({
                exited: Promise.resolve(1),
                stderr: new Response('pg_dump failed'),
            } as any);

            const options: ExportOptions = {
                tenantId: 'tenant-123',
                profile: 'native',
                requestedBy: 'user-456',
            };

            await expect(strategy.export(options)).rejects.toThrow('pg_dump failed');
        });

        it('should create manifest with pg_dump metadata', async () => {
            const options: ExportOptions = {
                tenantId: 'tenant-123',
                profile: 'native',
                requestedBy: 'user-456',
            };

            const result = await strategy.export(options);

            expect(result.manifest).toMatchObject({
                tenantId: 'tenant-123',
                profile: 'native',
                database: {
                    format: 'pg_dump',
                    compression: 'custom',
                },
                version: '1.0.0',
            });
        });

        it('should calculate checksum for binary dump', async () => {
            const options: ExportOptions = {
                tenantId: 'tenant-123',
                profile: 'native',
                requestedBy: 'user-456',
            };

            const result = await strategy.export(options);

            expect(result.checksum).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should cleanup on error', async () => {
            vi.mocked(Bun.spawn).mockReturnValueOnce({
                exited: Promise.resolve(1),
                stderr: new Response('Dump failed'),
            } as any);

            const options: ExportOptions = {
                tenantId: 'tenant-123',
                profile: 'native',
                requestedBy: 'user-456',
            };

            await expect(strategy.export(options)).rejects.toThrow();

            // Verify cleanup
            const spawnCalls = vi.mocked(Bun.spawn).mock.calls;
            const cleanupCall = spawnCalls.find(
                (call) => Array.isArray(call[0]) && call[0].includes('rm')
            );
            expect(cleanupCall).toBeDefined();
        });

        it('should set 24h expiry', async () => {
            const options: ExportOptions = {
                tenantId: 'tenant-123',
                profile: 'native',
                requestedBy: 'user-456',
            };

            const result = await strategy.export(options);

            const now = Date.now();
            const expiryTime = result.expiresAt.getTime();
            const expectedExpiry = now + 24 * 60 * 60 * 1000;

            expect(expiryTime).toBeGreaterThan(now);
            expect(expiryTime).toBeLessThanOrEqual(expectedExpiry + 1000);
        });
    });
});
