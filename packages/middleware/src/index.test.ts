import { describe, it, expect } from 'vitest';
import {
  getCurrentTenantContext,
  getCurrentTenantId,
  getTenantContext,
  hasTenantContext,
  requireTenantContext,
  runWithTenantContext,
  type TenantContext,
  tenantStorage,
} from './index.js';

describe('Middleware Module Exports', () => {
  it('should export getCurrentTenantContext', () => {
    expect(getCurrentTenantContext).toBeDefined();
  });

  it('should export getCurrentTenantId', () => {
    expect(getCurrentTenantId).toBeDefined();
  });

  it('should export getTenantContext', () => {
    expect(getTenantContext).toBeDefined();
  });

  it('should export hasTenantContext', () => {
    expect(hasTenantContext).toBeDefined();
  });

  it('should export requireTenantContext', () => {
    expect(requireTenantContext).toBeDefined();
  });

  it('should export runWithTenantContext', () => {
    expect(runWithTenantContext).toBeDefined();
  });

  it('should export tenantStorage', () => {
    expect(tenantStorage).toBeDefined();
  });
});
