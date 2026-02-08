/**
 * Audit Service Tests
 * Verifies S4 Protocol: Immutable Audit Logging
 * Coverage Target: 95%+
 */

import { publicPool } from '@apex/db';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type AuditLogEntry,
  initializeAuditTable,
  log,
  logProvisioning,
  logSecurityEvent,
  query,
} from './audit.service.js';

vi.mock('@apex/db', () => ({
  publicPool: {
    connect: vi.fn(),
  },
}));

vi.stubGlobal('crypto', {
  randomUUID: () => 'test-uuid-1234',
});

describe('Audit Service (S4 Protocol)', () => {
  let mockClient: {
    query: ReturnType<typeof vi.fn>;
    release: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockClient = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      release: vi.fn(),
    };
    vi.mocked(publicPool.connect).mockResolvedValue(mockClient as any);
    vi.spyOn(console, 'log').mockImplementation(() => { });
  });

  describe('log', () => {
    it('should insert audit record to database', async () => {
      const entry: AuditLogEntry = {
        timestamp: new Date('2026-01-01T00:00:00Z'),
        action: 'TENANT_PROVISIONED',
        userId: 'key-123',
        entityType: 'tenant',
        entityId: 'test-tenant',
        tenantId: 'test-tenant',
        ipAddress: '192.168.1.1',
        metadata: {
          plan: 'basic',
          subdomain: 'test',
          actorType: 'api_key',
        },
        severity: 'INFO',
        result: 'SUCCESS',
      };

      await log(entry);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO public.audit_logs'),
        expect.arrayContaining([
          'test-uuid-1234',
          '2026-01-01T00:00:00.000Z',
          'TENANT_PROVISIONED',
          'api_key',
          'key-123',
        ])
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should include optional email when provided', async () => {
      const entry: AuditLogEntry = {
        timestamp: new Date(),
        action: 'USER_LOGIN',
        userId: 'user-123',
        ipAddress: '10.0.0.1',
        entityType: 'user',
        entityId: 'user-123',
        metadata: {
          email: 'admin@example.com',
          actorType: 'user',
        },
        severity: 'INFO',
        result: 'SUCCESS',
      };

      await log(entry);

      const queryCall = mockClient.query.mock.calls[1];
      expect(queryCall[1]).toContain('admin@example.com');
    });

    it('should output structured log to console for monitoring', async () => {
      const entry: AuditLogEntry = {
        timestamp: new Date('2026-01-01T00:00:00Z'),
        action: 'USER_LOGIN_FAILED',
        userId: 'user-123',
        ipAddress: '10.0.0.1',
        entityType: 'user',
        entityId: 'user-123',
        metadata: {
          reason: 'invalid_password',
          actorType: 'user',
        },
        severity: 'HIGH',
        result: 'FAILURE',
      };

      await log(entry);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('"level":"audit"')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('"severity":"HIGH"')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('"action":"USER_LOGIN_FAILED"')
      );
    });

    it('should handle error messages in failed operations', async () => {
      const entry: AuditLogEntry = {
        timestamp: new Date(),
        action: 'TENANT_PROVISIONED',
        userId: 'system',
        ipAddress: '127.0.0.1',
        entityType: 'tenant',
        entityId: 'test',
        metadata: { actorType: 'system' },
        severity: 'HIGH',
        result: 'FAILURE',
        errorMessage: 'Database connection failed',
      };

      await log(entry);

      const queryCall = mockClient.query.mock.calls[1];
      expect(queryCall[1]).toContain('Database connection failed');
      expect(queryCall[1]).toContain('FAILURE');
    });

    it('should serialize metadata as JSON', async () => {
      const entry: AuditLogEntry = {
        timestamp: new Date(),
        action: 'SETTINGS_CHANGED',
        userId: 'admin-1',
        ipAddress: '10.0.0.1',
        entityType: 'tenant',
        entityId: 'tenant-1',
        tenantId: 'tenant-1',
        metadata: {
          changedFields: ['store_name', 'currency'],
          oldValues: { store_name: 'Old Name' },
          newValues: { store_name: 'New Name' },
          actorType: 'user',
        },
        severity: 'INFO',
        result: 'SUCCESS',
      };

      await log(entry);

      const queryCall = mockClient.query.mock.calls[1];
      const metadataJson = queryCall[1].find(
        (arg: any) => typeof arg === 'string' && arg.includes('changedFields')
      );
      expect(metadataJson).toContain('changedFields');
    });

    it('should always release connection even on error', async () => {
      mockClient.query.mockRejectedValue(new Error('DB Connection Lost'));

      const entry: AuditLogEntry = {
        timestamp: new Date(),
        action: 'TENANT_PROVISIONED',
        userId: 'system',
        ipAddress: '127.0.0.1',
        entityType: 'tenant',
        entityId: 'test',
        metadata: { actorType: 'system' },
        severity: 'HIGH',
        result: 'FAILURE',
      };

      await expect(log(entry)).rejects.toThrow('DB Connection Lost');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('query', () => {
    it('should query with tenant filter', async () => {
      mockClient.query.mockResolvedValue({
        rows: [
          {
            id: 'audit-1',
            timestamp: '2026-01-01T00:00:00Z',
            action: 'USER_LOGIN',
            actor_type: 'user',
            actor_id: 'user-1',
            ip_address: '10.0.0.1',
            target_type: 'tenant',
            target_id: 'tenant-1',
            target_tenant_id: 'tenant-1',
            metadata: '{}',
            severity: 'LOW',
            result: 'SUCCESS',
          },
        ],
      });

      const results = await query({ tenantId: 'tenant-1' });

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('target_tenant_id = $1'),
        ['tenant-1']
      );
      expect(results).toHaveLength(1);
      expect(results[0].action).toBe('USER_LOGIN');
    });

    it('should filter by action type', async () => {
      await query({ action: 'TENANT_PROVISIONED' });

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('action = $'),
        expect.arrayContaining(['TENANT_PROVISIONED'])
      );
    });

    it('should filter by severity', async () => {
      await query({ severity: 'CRITICAL' });

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('severity = $'),
        expect.arrayContaining(['CRITICAL'])
      );
    });

    it('should apply pagination (limit and offset)', async () => {
      await query({ limit: 10, offset: 20 });

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $'),
        expect.any(Array)
      );
    });

    it('should order by timestamp descending', async () => {
      await query();

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY timestamp DESC'),
        expect.any(Array)
      );
    });
  });

  describe('logProvisioning', () => {
    it('should log successful provisioning', async () => {
      await logProvisioning(
        'test-store',
        'basic',
        'admin-1',
        '192.168.1.1',
        true
      );

      const queryCall = mockClient.query.mock.calls[1];
      expect(queryCall[1]).toContain('TENANT_PROVISIONED');
      expect(queryCall[1]).toContain('SUCCESS');
      expect(queryCall[1]).toContain('test-store');
      expect(queryCall[1]).toContain('basic');
    });

    it('should log failed provisioning with error', async () => {
      const error = new Error('Schema creation failed');
      await logProvisioning(
        'test-store',
        'pro',
        'admin-1',
        '192.168.1.1',
        false,
        error
      );

      const queryCall = mockClient.query.mock.calls[1];
      expect(queryCall[1]).toContain('FAILURE');
      expect(queryCall[1]).toContain('Schema creation failed');
      expect(queryCall[1]).toContain('HIGH'); // Failures are HIGH severity
    });
  });

  describe('logSecurityEvent', () => {
    it('should log cross-tenant access as CRITICAL', async () => {
      await logSecurityEvent(
        'CROSS_TENANT_ACCESS_ATTEMPT',
        'attacker-123',
        'victim-tenant',
        '10.0.0.99',
        { requestedResource: 'orders', method: 'GET' }
      );

      const queryCall = mockClient.query.mock.calls[1];
      expect(queryCall[1]).toContain('CRITICAL');
      expect(queryCall[1]).toContain('CROSS_TENANT_ACCESS_ATTEMPT');
      expect(queryCall[1]).toContain('attacker-123');
      expect(queryCall[1]).toContain('victim-tenant');
      expect(queryCall[1][5]).toContain('requestedResource');
    });

    it('should always result in FAILURE for security events', async () => {
      await logSecurityEvent(
        'CROSS_TENANT_ACCESS_ATTEMPT',
        'attacker',
        'victim',
        '10.0.0.1'
      );

      const queryCall = mockClient.query.mock.calls[1];
      expect(queryCall[1]).toContain('FAILURE');
    });
  });

  describe('initializeAuditTable', () => {
    it('should create audit_logs table', async () => {
      await initializeAuditTable();

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS public.audit_logs')
      );
    });

    it('should create indexes for performance', async () => {
      await initializeAuditTable();

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'CREATE INDEX IF NOT EXISTS idx_audit_timestamp'
        )
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_audit_tenant')
      );
    });
  });
});
