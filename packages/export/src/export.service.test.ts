/**
 * Export Service Tests
 * Validates export functionality and security compliance
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ExportService } from './export.service.js';
import { ExportStrategyFactory } from './export-strategy.factory.js';
import { LiteExportStrategy } from './strategies/lite-export.strategy.js';
import { NativeExportStrategy } from './strategies/native-export.strategy.js';
import { AnalyticsExportStrategy } from './strategies/analytics-export.strategy.js';
import { secretsManager } from '@apex/security';

describe('ExportService', () => {
  let service: ExportService;
  let mockAudit: any;

  beforeEach(() => {
    mockAudit = {
      log: async () => {},
    };
    
    const factory = new ExportStrategyFactory(
      new LiteExportStrategy(),
      new NativeExportStrategy(),
      new AnalyticsExportStrategy(),
    );
    
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
      // Create first export
      const job1 = await service.createExportJob({
        tenantId: 'test-tenant',
        profile: 'lite',
        requestedBy: 'admin-123',
      });

      // Try to create second export (should fail)
      await expect(
        service.createExportJob({
          tenantId: 'test-tenant',
          profile: 'lite',
          requestedBy: 'admin-123',
        })
      ).rejects.toThrow('Export already in progress');

      // Cleanup
      await service.cancelJob(job1.id);
    });
  });

  describe('S14.2: Duplicate Detection', () => {
    it('should reject duplicate requests within 1 minute', async () => {
      const tenantId = 'dup-test-tenant';
      
      // First request
      await service.createExportJob({
        tenantId,
        profile: 'lite',
        requestedBy: 'admin-123',
      });

      // Immediate duplicate should fail
      await expect(
        service.createExportJob({
          tenantId,
          profile: 'lite',
          requestedBy: 'admin-123',
        })
      ).rejects.toThrow('already in progress');
    });
  });

  describe('S14.3: Export Validation', () => {
    it('should validate lite profile options', async () => {
      const result = await service.createExportJob({
        tenantId: 'valid-tenant',
        profile: 'lite',
        requestedBy: 'admin-123',
      });

      expect(result).toBeDefined();
      expect(result.profile).toBe('lite');
      expect(result.status).toBe('pending');
    });

    it('should reject analytics profile without date range', async () => {
      await expect(
        service.createExportJob({
          tenantId: 'test-tenant',
          profile: 'analytics',
          requestedBy: 'admin-123',
          // Missing dateRange
        })
      ).rejects.toThrow('Invalid export options');
    });

    it('should accept native profile for valid tenant', async () => {
      const result = await service.createExportJob({
        tenantId: 'native-test',
        profile: 'native',
        requestedBy: 'admin-123',
      });

      expect(result.profile).toBe('native');
    });
  });

  describe('S14.4: Job Management', () => {
    it('should track job status correctly', async () => {
      const job = await service.createExportJob({
        tenantId: 'status-test',
        profile: 'lite',
        requestedBy: 'admin-123',
      });

      const status = await service.getJobStatus(job.id);
      expect(status).toBeDefined();
      expect(status?.id).toBe(job.id);
      expect(['pending', 'processing', 'completed']).toContain(status?.status);
    });

    it('should allow cancelling pending jobs', async () => {
      const job = await service.createExportJob({
        tenantId: 'cancel-test',
        profile: 'lite',
        requestedBy: 'admin-123',
      });

      const cancelled = await service.cancelJob(job.id);
      expect(cancelled).toBe(true);

      const status = await service.getJobStatus(job.id);
      expect(status).toBeNull();
    });

    it('should list all tenant exports', async () => {
      const tenantId = 'list-test-tenant';
      
      await service.createExportJob({
        tenantId,
        profile: 'lite',
        requestedBy: 'admin-123',
      });

      const jobs = await service.listTenantExports(tenantId);
      expect(jobs.length).toBeGreaterThan(0);
      expect(jobs[0].tenantId).toBe(tenantId);
    });
  });

  describe('S14.5: Audit Logging', () => {
    it('should log export request', async () => {
      const auditSpy = vi.spyOn(mockAudit, 'log');

      await service.createExportJob({
        tenantId: 'audit-test',
        profile: 'lite',
        requestedBy: 'admin-123',
      });

      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'EXPORT_REQUESTED',
          entityType: 'EXPORT',
        })
      );
    });
  });
});

describe('Export Strategies', () => {
  describe('LiteExportStrategy', () => {
    let strategy: LiteExportStrategy;

    beforeEach(() => {
      strategy = new LiteExportStrategy();
    });

    it('should enforce row count limit (100K)', async () => {
      // Mock database with > 100K rows
      const mockPool = {
        connect: () => ({
          query: async (sql: string) => {
            if (sql.includes('COUNT')) {
              return { rows: [{ count: '150000' }] };
            }
            return { rows: [], rowCount: 0 };
          },
          release: () => {},
        }),
      };

      await expect(
        strategy.export({
          tenantId: 'big-tenant',
          profile: 'lite',
          requestedBy: 'admin',
        })
      ).rejects.toThrow('exceeds max rows');
    });

    it('should generate valid checksum', async () => {
      const result = await strategy.export({
        tenantId: 'checksum-test',
        profile: 'lite',
        requestedBy: 'admin',
      });

      expect(result.checksum).toBeDefined();
      expect(result.checksum.length).toBe(64); // SHA-256 hex
    });
  });
});
