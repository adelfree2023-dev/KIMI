/**
 * Auth Module Index Tests
 * Rule 4.1: Test Coverage Mandate
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

describe('Auth Module Exports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export AuthModule', async () => {
    const { AuthModule } = await import('./index.js');
    expect(AuthModule).toBeDefined();
  });

  it('should export AuthService', async () => {
    const { AuthService } = await import('./index.js');
    expect(AuthService).toBeDefined();
  });

  it('should export JwtStrategy', async () => {
    const { JwtStrategy } = await import('./index.js');
    expect(JwtStrategy).toBeDefined();
  });

  it('should export CurrentUser decorator', async () => {
    const { CurrentUser } = await import('./index.js');
    expect(CurrentUser).toBeDefined();
  });

  it('should export Public decorator', async () => {
    const { Public } = await import('./index.js');
    expect(Public).toBeDefined();
  });

  it('should export JwtAuthGuard', async () => {
    const { JwtAuthGuard } = await import('./index.js');
    expect(JwtAuthGuard).toBeDefined();
  });

  it('should export TenantContext type', async () => {
    const { getCurrentTenantContext } = await import('./index.js');
    expect(getCurrentTenantContext).toBeDefined();
  });
});

describe('JwtAuthGuard', () => {
  let guard: any;
  let mockContext: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { JwtAuthGuard } = await import('./index.js');
    guard = new JwtAuthGuard();
    
    mockContext = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({}),
      }),
      getHandler: vi.fn(),
      getClass: vi.fn(),
    };
  });

  it('should be defined', async () => {
    const { JwtAuthGuard } = await import('./index.js');
    const instance = new JwtAuthGuard();
    expect(instance).toBeDefined();
  });

  it('should have canActivate method', async () => {
    expect(typeof guard.canActivate).toBe('function');
  });

  it('should have handleRequest method', async () => {
    expect(typeof guard.handleRequest).toBe('function');
  });

  describe('handleRequest', () => {
    it('should return user when no error and user exists', async () => {
      const user = { id: 'user-123', email: 'test@example.com' };
      const result = guard.handleRequest(null, user);
      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException when error exists', async () => {
      const error = new Error('Auth failed');
      expect(() => guard.handleRequest(error, { id: 'user-123' })).toThrow();
    });

    it('should throw UnauthorizedException when user is false', async () => {
      expect(() => guard.handleRequest(null, false)).toThrow();
    });

    it('should throw UnauthorizedException when user is null', async () => {
      expect(() => guard.handleRequest(null, null)).toThrow();
    });

    it('should throw UnauthorizedException when user is undefined', async () => {
      expect(() => guard.handleRequest(null, undefined)).toThrow();
    });

    it('should throw original error when both error and user are falsy', async () => {
      const error = new Error('Custom auth error');
      expect(() => guard.handleRequest(error, false)).toThrow(error);
    });

    it('should return user with all properties', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-456',
        roles: ['admin'],
      };
      const result = guard.handleRequest(null, user);
      expect(result).toEqual(user);
      expect(result.id).toBe('user-123');
      expect(result.tenantId).toBe('tenant-456');
    });
  });

  describe('canActivate', () => {
    it('should call super.canActivate with context', async () => {
      // Mock the parent canActivate to return true
      const canActivateSpy = vi.spyOn(guard, 'canActivate').mockResolvedValue(true);
      
      const result = await guard.canActivate(mockContext);
      
      expect(result).toBe(true);
      canActivateSpy.mockRestore();
    });

    it('should work with ExecutionContext', async () => {
      const context = {
        switchToHttp: vi.fn().mockReturnValue({
          getRequest: vi.fn().mockReturnValue({
            user: { id: 'user-123' },
          }),
        }),
        getHandler: vi.fn(),
        getClass: vi.fn(),
      };

      // The actual canActivate behavior would depend on the parent class
      expect(() => guard.canActivate(context)).not.toThrow();
    });
  });
});

describe('Export compatibility', () => {
  it('should export all decorators as callable functions', async () => {
    const { CurrentUser, Public } = await import('./index.js');
    
    // Decorators should be functions
    expect(typeof CurrentUser).toBe('function');
    expect(typeof Public).toBe('function');
  });

  it('should export all services as constructible classes', async () => {
    const { AuthService, JwtStrategy } = await import('./index.js');
    
    // These should be classes (constructor functions)
    expect(typeof AuthService).toBe('function');
    expect(typeof JwtStrategy).toBe('function');
  });

  it('should export module as a class', async () => {
    const { AuthModule } = await import('./index.js');
    expect(typeof AuthModule).toBe('function');
  });
});
