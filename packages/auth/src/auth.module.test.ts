/**
 * Auth Module Tests
 * Rule 4.1: Test Coverage Mandate
 */

import { describe, expect, it, vi } from 'vitest';

// Mock @nestjs/passport BEFORE any imports
vi.mock('@nestjs/passport', () => ({
  PassportModule: {
    register: () => ({ module: 'PassportModule' }),
  },
  // PassportStrategy is a mixin function that returns a class
  PassportStrategy: () => class MockPassportStrategy {
    constructor() {}
  },
  AuthGuard: () => class MockAuthGuard {
    canActivate() { return true; }
    handleRequest(err: any, user: any) {
      if (err) throw err;
      if (!user) throw new Error('User not found');
      return user;
    }
  },
}));

vi.mock('@nestjs/jwt', () => ({
  JwtModule: {
    registerAsync: () => ({ module: 'JwtModule' }),
  },
  JwtService: class MockJwtService {},
}));

vi.mock('@apex/config', () => ({
  ConfigService: class MockConfigService {
    get(key: string) { return 'test-value'; }
    getWithDefault(key: string, defaultValue: string) { return defaultValue; }
  },
  validateEnv: () => ({ JWT_SECRET: 'test' }),
}));

describe('AuthModule', () => {
  it('should be defined', async () => {
    const { AuthModule } = await import('./auth.module.js');
    expect(AuthModule).toBeDefined();
  });

  it('should be a function (class)', async () => {
    const { AuthModule } = await import('./auth.module.js');
    expect(typeof AuthModule).toBe('function');
  });
});

describe('AuthModule Exports from index', () => {
  it('should export AuthModule from index', async () => {
    const { AuthModule } = await import('./index.js');
    expect(AuthModule).toBeDefined();
  });

  it('should export AuthService from index', async () => {
    const { AuthService } = await import('./index.js');
    expect(AuthService).toBeDefined();
  });

  it('should export JwtStrategy from index', async () => {
    const { JwtStrategy } = await import('./index.js');
    expect(JwtStrategy).toBeDefined();
  });

  it('should export decorators from index', async () => {
    const { CurrentUser, Public } = await import('./index.js');
    expect(typeof CurrentUser).toBe('function');
    expect(typeof Public).toBe('function');
  });

  it('should export JwtAuthGuard from index', async () => {
    const { JwtAuthGuard } = await import('./index.js');
    expect(JwtAuthGuard).toBeDefined();
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

  it('should throw when user is falsy', async () => {
    const { JwtAuthGuard } = await import('./index.js');
    const guard = new JwtAuthGuard();
    expect(() => guard.handleRequest(null, false)).toThrow();
    expect(() => guard.handleRequest(null, null)).toThrow();
    expect(() => guard.handleRequest(null, undefined)).toThrow();
  });
});
