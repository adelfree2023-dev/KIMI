/**
 * Tenant Context Tests
 * S2 Protocol: Tenant Isolation
 */

import { describe, expect, it } from 'vitest';
import {
  type TenantContext,
  getTenantContext,
  hasTenantContext,
  tenantStorage,
} from './tenant-context.js';

describe('Tenant Context (Legacy)', () => {
  it('should export tenantStorage', () => {
    expect(tenantStorage).toBeDefined();
  });

  it('should throw when getting context outside of scope', () => {
    // Ensure we're outside any context
    expect(() => getTenantContext()).toThrow(
      'S2 Violation: Tenant context accessed outside of tenant scope'
    );
  });

  it('should return false when checking context outside of scope', () => {
    expect(hasTenantContext()).toBe(false);
  });

  it('should work within a context', async () => {
    const mockContext: TenantContext = {
      tenantId: 'test-tenant',
      subdomain: 'test',
      plan: 'pro',
      features: ['feature1'],
    };

    await tenantStorage.run(mockContext, async () => {
      expect(hasTenantContext()).toBe(true);
      expect(getTenantContext()).toEqual(mockContext);
    });
  });

  it('should handle multiple contexts', async () => {
    const context1: TenantContext = {
      tenantId: 'tenant-1',
      subdomain: 'sub1',
      plan: 'free',
      features: [],
    };

    const context2: TenantContext = {
      tenantId: 'tenant-2',
      subdomain: 'sub2',
      plan: 'pro',
      features: ['analytics'],
    };

    // Run both contexts and verify isolation
    const result1 = await tenantStorage.run(context1, async () => {
      return getTenantContext();
    });

    const result2 = await tenantStorage.run(context2, async () => {
      return getTenantContext();
    });

    expect(result1.tenantId).toBe('tenant-1');
    expect(result2.tenantId).toBe('tenant-2');
  });
});
