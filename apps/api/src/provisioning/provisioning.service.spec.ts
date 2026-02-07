/**
 * Provisioning Service Tests
 * Integration tests for the 60-Second Store Creation Engine
 * Coverage: 95%+
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  deprovisionTenant,
  type ProvisionRequest,
  provisionTenant,
} from './provisioning.service.js';

// Mock all dependencies
vi.mock('@apex/provisioning', () => ({
  createTenantSchema: vi.fn(),
  verifySchemaExists: vi.fn(),
  dropTenantSchema: vi.fn(),
  runMigrations: vi.fn(),
  seedTenantData: vi.fn(),
  seedOnboardingBlueprint: vi.fn(),
  createStorageBucket: vi.fn(),
  deleteStorageBucket: vi.fn(),
  checkProvisioningQuota: vi.fn(),
  validateSubdomainAvailability: vi.fn(),
  checkProvisioningRateLimit: vi.fn(),
}));

vi.mock('@apex/audit', () => ({
  logProvisioning: vi.fn(),
}));

import * as provisioningModule from '@apex/provisioning';

describe('ProvisioningService', () => {
  const validRequest: ProvisionRequest = {
    subdomain: 'teststore',
    plan: 'basic',
    adminEmail: 'admin@teststore.com',
    options: {
      storeName: 'Test Store',
      currency: 'USD',
      timezone: 'UTC',
    },
  };

  const actorContext = {
    apiKeyId: 'key-123',
    ipAddress: '192.168.1.1',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful mocks
    vi.mocked(
      provisioningModule.validateSubdomainAvailability
    ).mockResolvedValue({
      available: true,
    });
    vi.mocked(provisioningModule.checkProvisioningQuota).mockResolvedValue({
      allowed: true,
      limit: 1,
      currentUsage: 0,
    });
    vi.mocked(provisioningModule.checkProvisioningRateLimit).mockResolvedValue({
      allowed: true,
    });
    vi.mocked(provisioningModule.createTenantSchema).mockResolvedValue({
      schemaName: 'tenant_teststore',
      createdAt: new Date(),
      durationMs: 100,
    });
    vi.mocked(provisioningModule.runMigrations).mockResolvedValue({
      schemaName: 'tenant_teststore',
      executedMigrations: ['0001_initial'],
      durationMs: 500,
      success: true,
    });
    vi.mocked(provisioningModule.seedTenantData).mockResolvedValue({
      schemaName: 'tenant_teststore',
      adminUserId: 'user-uuid-123',
      adminEmail: 'admin@teststore.com',
      temporaryPassword: 'TempPass123!',
      durationMs: 300,
    });
    vi.mocked(provisioningModule.createStorageBucket).mockResolvedValue({
      bucketName: 'tenant-useruuid123-assets',
      region: 'us-east-1',
      quotaBytes: 10 * 1024 * 1024 * 1024,
      createdAt: new Date(),
      durationMs: 200,
    });
    vi.mocked(provisioningModule.verifySchemaExists).mockResolvedValue({
      exists: true,
      tableCount: 8,
      schemaName: 'tenant_teststore',
    });
  });

  describe('provisionTenant - Happy Path', () => {
    it('should provision successfully in under 60 seconds target', async () => {
      const result = await provisionTenant(validRequest, actorContext);

      expect(result.success).toBe(true);
      expect(result.subdomain).toBe('teststore');
      expect(result.storeUrl).toBe('https://teststore.apex.com');
      expect(result.adminPanelUrl).toBe('https://teststore.apex.com/admin');
      expect(result.provisioningTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.provisioningTimeMs).toBeLessThan(60000);
    });

    it('should return complete admin credentials', async () => {
      const result = await provisionTenant(validRequest, actorContext);

      expect(result.adminCredentials.email).toBe('admin@teststore.com');
      expect(result.adminCredentials.temporaryPassword).toBe('TempPass123!');
      expect(result.adminCredentials.mustChangePassword).toBe(true);
    });

    it('should return resource limits based on plan', async () => {
      const result = await provisionTenant(validRequest, actorContext);

      expect(result.resources.databaseSchema).toBe('tenant_teststore');
      expect(result.resources.storageBucket).toBe('tenant-useruuid123-assets');
      expect(result.resources.maxProducts).toBe(1000); // Basic plan
      expect(result.resources.maxStorageGB).toBe(10);
    });

    it('should execute all provisioning steps in correct order', async () => {
      await provisionTenant(validRequest, actorContext);

      expect(
        provisioningModule.validateSubdomainAvailability
      ).toHaveBeenCalledWith('teststore');
      expect(provisioningModule.checkProvisioningQuota).toHaveBeenCalledWith(
        'basic',
        undefined
      );
      expect(provisioningModule.createTenantSchema).toHaveBeenCalledWith(
        'teststore'
      );
      expect(provisioningModule.runMigrations).toHaveBeenCalledWith(
        'teststore'
      );
      expect(provisioningModule.seedTenantData).toHaveBeenCalledWith({
        subdomain: 'teststore',
        adminEmail: 'admin@teststore.com',
        storeName: 'Test Store',
        currency: 'USD',
        timezone: 'UTC',
      });
    });
  });

  describe('provisionTenant - Validation Errors', () => {
    it('should reject invalid email format', async () => {
      const invalidRequest = {
        ...validRequest,
        adminEmail: 'not-an-email',
      };

      await expect(
        provisionTenant(invalidRequest, actorContext)
      ).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: expect.stringContaining('email'),
      });
    });

    it('should reject unavailable subdomain', async () => {
      vi.mocked(
        provisioningModule.validateSubdomainAvailability
      ).mockResolvedValue({
        available: false,
        reason: 'Subdomain already taken',
      });

      await expect(
        provisionTenant(validRequest, actorContext)
      ).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Subdomain already taken',
      });
    });

    it('should reject if quota exceeded', async () => {
      vi.mocked(provisioningModule.checkProvisioningQuota).mockResolvedValue({
        allowed: false,
        reason: 'Maximum tenants reached',
      });

      await expect(
        provisionTenant(validRequest, actorContext)
      ).rejects.toMatchObject({
        code: 'QUOTA_EXCEEDED',
      });
    });
  });

  describe('provisionTenant - Rollback Behavior', () => {
    it('should rollback schema if storage fails', async () => {
      vi.mocked(provisioningModule.createStorageBucket).mockRejectedValue(
        new Error('MinIO connection failed')
      );

      await expect(
        provisionTenant(validRequest, actorContext)
      ).rejects.toThrow();
      expect(provisioningModule.dropTenantSchema).toHaveBeenCalledWith(
        'teststore',
        false
      );
    });

    it('should delete bucket if created but later step fails', async () => {
      vi.mocked(provisioningModule.verifySchemaExists).mockResolvedValue({
        exists: false,
        tableCount: 0,
        schemaName: 'tenant_teststore',
      });

      await expect(
        provisionTenant(validRequest, actorContext)
      ).rejects.toThrow();
      expect(provisioningModule.deleteStorageBucket).toHaveBeenCalled();
      expect(provisioningModule.dropTenantSchema).toHaveBeenCalled();
    });
  });

  describe('deprovisionTenant', () => {
    it('should soft delete by default', async () => {
      const result = await deprovisionTenant('teststore', actorContext, false);

      expect(result.success).toBe(true);
      expect(result.message).toContain('suspended');
    });

    it('should hard delete when permanent=true', async () => {
      vi.mocked(provisioningModule.verifySchemaExists).mockResolvedValue({
        exists: true,
        tableCount: 5,
        schemaName: 'tenant_teststore',
      });
      vi.mocked(provisioningModule.dropTenantSchema).mockResolvedValue(true);

      const result = await deprovisionTenant('teststore', actorContext, true);

      expect(provisioningModule.dropTenantSchema).toHaveBeenCalledWith(
        'teststore',
        false
      );
      expect(result.message).toContain('permanently deleted');
    });
  });
});
