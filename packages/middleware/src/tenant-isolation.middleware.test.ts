/**
 * Tenant Isolation Middleware Tests
 * S2 Protocol: Tenant Isolation
 */

import { publicDb } from '@apex/db';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tenantStorage } from './connection-context.js';
import {
  SuperAdminOrTenantGuard,
  TenantIsolationMiddleware,
  TenantScopedGuard,
} from './tenant-isolation.middleware.js';

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
    run: vi.fn((_context, callback) => callback()),
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

    await expect(
      middleware.use(mockReq as any, mockRes as any, mockNext)
    ).rejects.toThrow('Invalid tenant: unknown');
  });

  it('should handle ports in host header', async () => {
    const mockReq = {
      headers: { host: 'alpha.apex.localhost:3000' },
    };

    const mockTenant = {
      id: 'uuid-123',
      subdomain: 'alpha',
      plan: 'basic',
      status: 'active',
    };

    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([mockTenant]),
    };
    vi.mocked(publicDb.select).mockReturnValue(mockSelect as any);

    await middleware.use(mockReq as any, mockRes as any, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should support production subdomains', async () => {
    const mockReq = {
      headers: { host: 'alpha.60sec.shop' },
    };

    const mockTenant = {
      id: 'uuid-123',
      subdomain: 'alpha',
      plan: 'basic',
      status: 'active',
    };

    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([mockTenant]),
    };
    vi.mocked(publicDb.select).mockReturnValue(mockSelect as any);

    await middleware.use(mockReq as any, mockRes as any, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should throw UnauthorizedException for suspended tenant', async () => {
    const mockReq = {
      headers: { host: 'suspended.apex.localhost' },
    };

    const mockTenant = {
      id: 'uuid-suspended',
      subdomain: 'suspended',
      plan: 'basic',
      status: 'suspended',
    };

    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([mockTenant]),
    };
    vi.mocked(publicDb.select).mockReturnValue(mockSelect as any);

    await expect(
      middleware.use(mockReq as any, mockRes as any, mockNext)
    ).rejects.toThrow('Invalid tenant: suspended');
  });

  it('should throw UnauthorizedException for pending tenant', async () => {
    const mockReq = {
      headers: { host: 'pending.apex.localhost' },
    };

    const mockTenant = {
      id: 'uuid-pending',
      subdomain: 'pending',
      plan: 'basic',
      status: 'pending',
    };

    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([mockTenant]),
    };
    vi.mocked(publicDb.select).mockReturnValue(mockSelect as any);

    await expect(
      middleware.use(mockReq as any, mockRes as any, mockNext)
    ).rejects.toThrow('Invalid tenant: pending');
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

    expect(() => guard.canActivate(mockContext as any)).toThrow(
      'Tenant context required'
    );
  });

  it('should deny access if tenant is suspended (isActive=false)', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          tenantContext: { isActive: false, tenantId: 'suspended-tenant' },
        }),
      }),
    };

    expect(() => guard.canActivate(mockContext as any)).toThrow(
      'Tenant is suspended'
    );
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

    expect(() => guard.canActivate(mockContext as any)).toThrow(
      'Cross-tenant access denied'
    );
  });

  it('should deny access when tenant is inactive without super_admin role', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { role: 'user', tenantId: 'tenant-1' },
          tenantContext: { tenantId: 'tenant-1', isActive: false },
        }),
      }),
    };

    expect(() => guard.canActivate(mockContext as any)).toThrow(
      'Tenant access denied'
    );
  });

  it('should deny access when tenantContext is missing for non-superadmin', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { role: 'admin', tenantId: 'tenant-1' },
          tenantContext: null,
        }),
      }),
    };

    expect(() => guard.canActivate(mockContext as any)).toThrow(
      'Tenant access denied'
    );
  });
});
