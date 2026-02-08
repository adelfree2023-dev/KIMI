/**
 * Tenant Isolation Middleware Tests
 * S2 Protocol: Tenant Isolation
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  TenantIsolationMiddleware,
  TenantScopedGuard,
  SuperAdminOrTenantGuard,
} from './tenant-isolation.middleware.js';
import { publicDb, tenants } from '@apex/db';
import { tenantStorage } from './connection-context.js';

// Mock @apex/db
vi.mock('@apex/db', () => ({
  publicDb: {
    select: vi.fn(),
  },
  tenants: {
    id: 'id',
    subdomain: 'subdomain',
    plan: 'plan',
    status: 'status',
  },
}));

// Mock connection-context
vi.mock('./connection-context.js', () => ({
  tenantStorage: {
    run: vi.fn((context, callback) => callback()),
  },
}));

describe('TenantIsolationMiddleware', () => {
  let middleware: TenantIsolationMiddleware;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    vi.clearAllMocks();
    middleware = new TenantIsolationMiddleware();
    mockRes = {
      setHeader: vi.fn(),
    };
    mockNext = vi.fn();
  });

  it('should allow root domain requests', async () => {
    const mockReq = {
      headers: { host: 'apex.localhost' },
    };

    await middleware.use(mockReq as any, mockRes as any, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should extract tenant from subdomain and validate', async () => {
    const mockReq = {
      headers: { host: 'alpha.apex.localhost' },
    };

    const mockTenant = {
      id: 'uuid-123',
      subdomain: 'alpha',
      plan: 'basic',
      status: 'active',
    };

    // Mock DB response
    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([mockTenant]),
    };
    vi.mocked(publicDb.select).mockReturnValue(mockSelect as any);

    await middleware.use(mockReq as any, mockRes as any, mockNext);

    expect(publicDb.select).toHaveBeenCalled();
    expect(tenantStorage.run).toHaveBeenCalled();
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Tenant-ID', 'uuid-123');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should throw UnauthorizedException for unknown tenant', async () => {
    const mockReq = {
      headers: { host: 'unknown.apex.localhost' },
    };

    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(publicDb.select).mockReturnValue(mockSelect as any);

    await expect(middleware.use(mockReq as any, mockRes as any, mockNext))
      .rejects.toThrow('Invalid tenant: unknown');
  });
});

describe('TenantScopedGuard', () => {
  let guard: TenantScopedGuard;

  beforeEach(() => {
    guard = new TenantScopedGuard();
  });

  it('should allow access if tenant context is active', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          tenantContext: { isActive: true },
        }),
      }),
    };

    expect(guard.canActivate(mockContext as any)).toBe(true);
  });

  it('should deny access if tenant context is missing', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    };

    expect(() => guard.canActivate(mockContext as any)).toThrow('Tenant context required');
  });
});

describe('SuperAdminOrTenantGuard', () => {
  let guard: SuperAdminOrTenantGuard;

  beforeEach(() => {
    guard = new SuperAdminOrTenantGuard();
  });

  it('should allow super_admin bypass', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { role: 'super_admin' },
        }),
      }),
    };

    expect(guard.canActivate(mockContext as any)).toBe(true);
  });

  it('should allow user if tenant matches', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { role: 'user', tenantId: 'tenant-1' },
          tenantContext: { tenantId: 'tenant-1', isActive: true },
        }),
      }),
    };

    expect(guard.canActivate(mockContext as any)).toBe(true);
  });

  it('should deny cross-tenant access', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { role: 'user', tenantId: 'tenant-1' },
          tenantContext: { tenantId: 'tenant-2', isActive: true },
        }),
      }),
    };

    expect(() => guard.canActivate(mockContext as any)).toThrow('Cross-tenant access denied');
  });
});
