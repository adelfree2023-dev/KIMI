/**
 * Auth Module Index Tests
 * Rule 4.1: Test Coverage Mandate
 */

import { describe, expect, it, vi } from 'vitest';

// Mock @nestjs/passport BEFORE importing
// Mock @nestjs/passport BEFORE importing
vi.mock('@nestjs/passport', () => ({
  PassportModule: {
    register: () => ({ module: 'PassportModule' }),
  },
  // PassportStrategy is a mixin function that returns a class
  PassportStrategy: () => class MockPassportStrategy {
    constructor() { }
  },
  AuthGuard: () => class MockAuthGuard {
    canActivate() { return true; }
  },
}));

describe('Auth Module Exports', () => {
  it('should export AuthModule', async () => {
    const { AuthModule } = await import('./index.js');
    expect(AuthModule).toBeDefined();
  }, 10000);

  it('should export AuthService', async () => {
    const { AuthService } = await import('./index.js');
    expect(AuthService).toBeDefined();
  }, 10000);

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

  it('should export getCurrentTenantContext', async () => {
    const { getCurrentTenantContext } = await import('./index.js');
    expect(getCurrentTenantContext).toBeDefined();
  });
});

describe('JwtAuthGuard', () => {
  it('should be constructible', async () => {
    const { JwtAuthGuard } = await import('./index.js');
    const guard = new JwtAuthGuard();
    expect(guard).toBeDefined();
  });

  it('should have handleRequest method', async () => {
    const { JwtAuthGuard } = await import('./index.js');
    const guard = new JwtAuthGuard();
    expect(typeof guard.handleRequest).toBe('function');
  });

  it('should return user when no error and user exists', async () => {
    const { JwtAuthGuard } = await import('./index.js');
    const guard = new JwtAuthGuard();
    const user = { id: 'user-123', email: 'test@example.com' };
    const result = guard.handleRequest(null, user);
    expect(result).toEqual(user);
  });

  it('should throw when error exists', async () => {
    const { JwtAuthGuard } = await import('./index.js');
    const guard = new JwtAuthGuard();
    const error = new Error('Auth failed');
    expect(() => guard.handleRequest(error, null)).toThrow();
  });

  it('should throw when user is false', async () => {
    const { JwtAuthGuard } = await import('./index.js');
    const guard = new JwtAuthGuard();
    expect(() => guard.handleRequest(null, false)).toThrow();
  });

  it('should throw when user is null', async () => {
    const { JwtAuthGuard } = await import('./index.js');
    const guard = new JwtAuthGuard();
    expect(() => guard.handleRequest(null, null)).toThrow();
  });

  it('should throw when user is undefined', async () => {
    const { JwtAuthGuard } = await import('./index.js');
    const guard = new JwtAuthGuard();
    expect(() => guard.handleRequest(null, undefined)).toThrow();
  });
});

describe('Export compatibility', () => {
  it('should export all decorators as callable functions', async () => {
    const { CurrentUser, Public } = await import('./index.js');
    expect(typeof CurrentUser).toBe('function');
    expect(typeof Public).toBe('function');
  });

  it('should export all services as constructible classes', async () => {
    const { AuthService, JwtStrategy } = await import('./index.js');
    expect(typeof AuthService).toBe('function');
    expect(typeof JwtStrategy).toBe('function');
  });

  it('should export module as a class', async () => {
    const { AuthModule } = await import('./index.js');
    expect(typeof AuthModule).toBe('function');
  });
});
