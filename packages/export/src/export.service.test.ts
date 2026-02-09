/**
 * Export Service Tests
 * Validates export functionality and security compliance
 */

import { publicPool } from '@apex/db';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExportService } from './export.service.js';

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

// Mock strategies and factory
const mockStrategy = {
  validate: vi.fn().mockResolvedValue(true),
  export: vi
    .fn()
    .mockResolvedValue({ checksum: 'mock-checksum', expiresAt: new Date() }),
};

const mockFactory = {
  create: vi.fn(() => mockStrategy),
  validateOptions: vi.fn().mockResolvedValue(true),
};

describe('ExportService', () => {
  let service: ExportService;
  const mockAudit = { log: vi.fn() } as any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock behavior for database
    vi.mocked(publicPool).connect.mockResolvedValue({
      query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: vi.fn(),
    } as any);

    // Mock Bun global
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

    // Reset factory mocks
    mockFactory.validateOptions.mockResolvedValue(true);
    mockFactory.create.mockReturnValue(mockStrategy);

    // Instantiate service with mock factory
    service = new ExportService(mockFactory as any, mockAudit);

    // Silence logger for tests
    (service as any).logger = { log: vi.fn(), error: vi.fn(), debug: vi.fn() };
  });

  describe('S14.1: Tenant Isolation', () => {
    it('should reject export for non-existent tenant', async () => {
      mockFactory.validateOptions.mockResolvedValueOnce(false);

      await expect(
        service.createExportJob({
          tenantId: 'non-existent-tenant',
          profile: 'lite',
          requestedBy: 'admin-123',
        })
      ).rejects.toThrow('Invalid export options');
    });

    it('should allow only one concurrent export per tenant', async () => {
      // Mock queue.getJobs to simulate an active job
      const mockJob = { data: { tenantId: 'test-tenant' }, id: 'job-1' };
      (service as any).exportQueue.getJobs = vi
        .fn()
        .mockResolvedValue([mockJob]);

      await expect(
        service.createExportJob({
          tenantId: 'test-tenant',
          profile: 'lite',
          requestedBy: 'admin-123',
        })
      ).rejects.toThrow('Export already in progress');
    });
  });

  describe('S14.2: Duplicate Detection', () => {
    it('should reject duplicate requests within 1 minute', async () => {
      const tenantId = 'dup-test-tenant';
      const recentJob = {
        data: { tenantId, profile: 'lite' },
        processedOn: Date.now() - 30000, // 30s ago
      };

      (service as any).exportQueue.getJobs = vi
        .fn()
        .mockImplementation(async (types) => {
          if (types.includes('completed')) return [recentJob];
          return [];
        });

      await expect(
        service.createExportJob({
          tenantId,
          profile: 'lite',
          requestedBy: 'admin-123',
        })
      ).rejects.toThrow('Duplicate export request');
    });
  });
});

// Separate tests for strategies
import { LiteExportStrategy } from './strategies/lite-export.strategy.js';

describe('LiteExportStrategy', () => {
  let strategy: LiteExportStrategy;
  const mockTenantRegistry = {
    exists: vi.fn().mockResolvedValue(true),
  } as any;

  beforeEach(() => {
    strategy = new LiteExportStrategy(mockTenantRegistry);
    vi.clearAllMocks();
  });

  it('should enforce row count limit', async () => {
    vi.mocked(publicPool).connect.mockResolvedValue({
      query: vi.fn().mockResolvedValue({ rows: [{ count: '150000' }] }),
      release: vi.fn(),
    } as any);

    const promise = strategy.export({
      tenantId: 'big-tenant',
      profile: 'lite',
      requestedBy: 'admin',
    });

    await expect(promise).rejects.toThrow(/exceeds max rows/);
  });

  it('should generate valid checksum', async () => {
    vi.mocked(publicPool).connect.mockResolvedValue({
      query: vi.fn().mockImplementation(async (sql) => {
        if (sql.includes('COUNT')) return { rows: [{ count: '10' }] };
        if (sql.includes('SELECT table_name'))
          return { rows: [{ table_name: 'test' }], rowCount: 1 };
        const isSelect = sql.includes('SELECT');
        return isSelect
          ? { rows: [{ id: 1 }], rowCount: 1 }
          : { rows: [], rowCount: 0 };
      }),
      release: vi.fn(),
    } as any);

    const result = await strategy.export({
      tenantId: 'checksum-test',
      profile: 'lite',
      requestedBy: 'admin',
    });

    expect(result.checksum).toBeDefined();
    expect(result.checksum.length).toBe(64);
  });
});
