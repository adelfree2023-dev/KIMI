/**
 * Export Service Tests
 * Validates export functionality and security compliance
 */

import { publicPool } from '@apex/db';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExportStrategyFactory } from './export-strategy.factory.js';
import { ExportService } from './export.service.js';
import { AnalyticsExportStrategy } from './strategies/analytics-export.strategy.js';
import { LiteExportStrategy } from './strategies/lite-export.strategy.js';
import { NativeExportStrategy } from './strategies/native-export.strategy.js';

// Mock DB
vi.mock('@apex/db', () => ({
  publicPool: {
    connect: vi.fn(),
    query: vi.fn(),
  },
  publicDb: {
    select: vi.fn(),
  },
}));

// Mock strategies
vi.mock('./strategies/lite-export.strategy.js');
vi.mock('./export-strategy.factory.js');

describe('ExportService', () => {
  let service: ExportService;
  const mockAudit = { log: vi.fn() } as any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Simplify database mock to reduce cognitive complexity
    const mockQuery = async (sql: string, params?: any[]) => {
      if (typeof sql !== 'string') return { rows: [], rowCount: 0 };

      // Tenant check
      if (sql.includes('SELECT 1 FROM public.tenants')) {
        const isNonExistent = params && params[0] === 'non-existent-tenant';
        return isNonExistent
          ? { rows: [], rowCount: 0 }
          : { rows: [{ 1: 1 }], rowCount: 1 };
      }

      // Table check
      if (sql.includes('SELECT table_name')) {
        return { rows: [{ table_name: 'test_table' }], rowCount: 1 };
      }

      return { rows: [], rowCount: 0 };
    };

    vi.mocked(publicPool).connect.mockResolvedValue({
      query: vi.fn().mockImplementation(mockQuery),
      release: vi.fn(),
    } as any);

    const mockTenantRegistry = {
      exists: vi
        .fn()
        .mockImplementation(async (id) => id !== 'non-existent-tenant'),
    } as any;

    const factory = new ExportStrategyFactory(
      new LiteExportStrategy(mockTenantRegistry),
      new NativeExportStrategy(),
      new AnalyticsExportStrategy()
    );

    // Mock Bun
    vi.stubGlobal('Bun', {
      spawn: vi.fn().mockReturnValue({
        exited: Promise.resolve(),
        exitCode: 0,
      }),
      write: vi.fn().mockResolvedValue(undefined),
      file: vi.fn().mockReturnValue({
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(10)),
        stat: vi.fn().mockResolvedValue({ size: 100 }),
      }),
    });

    service = new ExportService(factory, mockAudit);
  });

  describe('S14.1: Tenant Isolation', () => {
    it('should reject export for non-existent tenant', async () => {
      await expect(
        service.createExportJob({
          tenantId: 'non-existent-tenant',
          profile: 'lite',
          requestedBy: 'admin-123',
        })
      ).rejects.toThrow('Invalid export options');
    });

    it('should allow only one concurrent export per tenant', async () => {
      const job1 = await service.createExportJob({
        tenantId: 'test-tenant',
        profile: 'lite',
        requestedBy: 'admin-123',
      });

      await expect(
        service.createExportJob({
          tenantId: 'test-tenant',
          profile: 'lite',
          requestedBy: 'admin-123',
        })
      ).rejects.toThrow('Export already in progress');

      await service.cancelJob(job1.id);
    });
  });

  describe('Strategy Verification', () => {
    describe('LiteExportStrategy', () => {
      let strategy: LiteExportStrategy;

      beforeEach(() => {
        // Simple query mock for strategy tests
        const strategyQuery = async (sql: string) => {
          if (sql.includes('COUNT')) return { rows: [{ count: '10' }] };
          if (sql.includes('SELECT table_name')) {
            return { rows: [{ table_name: 'test_table' }], rowCount: 1 };
          }
          const isSelect = sql.includes('SELECT');
          return isSelect
            ? { rows: [{ id: 1, name: 'data' }], rowCount: 1 }
            : { rows: [], rowCount: 0 };
        };

        vi.mocked(publicPool).connect.mockResolvedValue({
          query: vi.fn().mockImplementation(strategyQuery),
          release: vi.fn(),
        } as any);

        const mockTenantRegistry = {
          exists: vi.fn().mockResolvedValue(true),
        } as any;
        strategy = new LiteExportStrategy(mockTenantRegistry);
      });

      it('should enforce row count limit', async () => {
        // Override with high count
        vi.mocked(publicPool).connect.mockReturnValue({
          query: vi.fn().mockResolvedValue({ rows: [{ count: '150000' }] }),
          release: vi.fn(),
        } as any);

        await expect(
          strategy.export({
            tenantId: 'big-tenant',
            profile: 'lite',
            requestedBy: 'admin',
          })
        ).rejects.toThrow(/exceeds max rows/);
      });

      it('should generate valid checksum', async () => {
        const result = await strategy.export({
          tenantId: 'checksum-test',
          profile: 'lite',
          requestedBy: 'admin',
        });

        expect(result.checksum).toBeDefined();
        expect(result.checksum.length).toBe(64);
      });
    });
  });
});
