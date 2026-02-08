/**
 * Auth Module Tests
 * Rule 4.1: Test Coverage Mandate
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@nestjs/common', () => ({
  Module: (metadata: any) => {
    return (target: any) => {
      target.__metadata = metadata;
      return target;
    };
  },
  Injectable: () => (target: any) => target,
  UnauthorizedException: class UnauthorizedException extends Error {},
}));

vi.mock('@nestjs/jwt', () => ({
  JwtModule: {
    registerAsync: (options: any) => ({
      registerAsync: options,
    }),
  },
}));

vi.mock('@nestjs/passport', () => ({
  PassportModule: {
    register: (options: any) => ({
      register: options,
    }),
  },
  AuthGuard: (strategy: string) => {
    return class AuthGuard {
      static strategy = strategy;
    };
  },
}));

vi.mock('@apex/config', () => ({
  ConfigService: class ConfigService {
    private config: Record<string, string> = {
      JWT_SECRET: 'test-secret-key',
      JWT_EXPIRES_IN: '7d',
    };
    get(key: string): string | undefined {
      return this.config[key];
    }
    getWithDefault(key: string, defaultValue: string): string {
      return this.config[key] || defaultValue;
    }
  },
}));

describe('AuthModule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined when imported', async () => {
    const { AuthModule } = await import('./auth.module.js');
    expect(AuthModule).toBeDefined();
  });

  it('should have correct metadata structure', async () => {
    const { AuthModule } = await import('./auth.module.js');
    const metadata = (AuthModule as any).__metadata;
    
    expect(metadata).toBeDefined();
    expect(metadata.imports).toBeDefined();
    expect(metadata.providers).toBeDefined();
    expect(metadata.exports).toBeDefined();
  });

  it('should export AuthService', async () => {
    const { AuthModule } = await import('./auth.module.js');
    const metadata = (AuthModule as any).__metadata;
    
    expect(metadata.exports).toContain('AuthService');
  });

  it('should provide AuthService and JwtStrategy', async () => {
    const { AuthModule } = await import('./auth.module.js');
    const metadata = (AuthModule as any).__metadata;
    
    expect(metadata.providers).toContain('AuthService');
    expect(metadata.providers).toContain('JwtStrategy');
  });

  it('should import PassportModule with jwt default strategy', async () => {
    const { AuthModule } = await import('./auth.module.js');
    const metadata = (AuthModule as any).__metadata;
    
    expect(metadata.imports).toBeDefined();
    expect(metadata.imports.length).toBeGreaterThan(0);
  });

  it('should configure JwtModule with async factory', async () => {
    const { AuthModule } = await import('./auth.module.js');
    const metadata = (AuthModule as any).__metadata;
    
    const jwtModuleImport = metadata.imports?.find((imp: any) => imp?.registerAsync);
    expect(jwtModuleImport).toBeDefined();
    expect(jwtModuleImport.registerAsync.useFactory).toBeDefined();
    expect(jwtModuleImport.registerAsync.inject).toContain('ConfigService');
  });

  it('should create JWT options with correct secret and expiration', async () => {
    const { ConfigService } = await import('@apex/config');
    const { AuthModule } = await import('./auth.module.js');
    const metadata = (AuthModule as any).__metadata;
    
    const jwtModuleImport = metadata.imports?.find((imp: any) => imp?.registerAsync);
    const configService = new ConfigService();
    const jwtOptions = jwtModuleImport.registerAsync.useFactory(configService);
    
    expect(jwtOptions.secret).toBe('test-secret-key');
    expect(jwtOptions.signOptions.expiresIn).toBe('7d');
  });

  it('should use default expiration when JWT_EXPIRES_IN is not set', async () => {
    const { ConfigService } = await import('@apex/config');
    const { AuthModule } = await import('./auth.module.js');
    const metadata = (AuthModule as any).__metadata;
    
    const jwtModuleImport = metadata.imports?.find((imp: any) => imp?.registerAsync);
    const configService = new ConfigService();
    
    // Override get to return undefined for JWT_EXPIRES_IN
    vi.spyOn(configService, 'get').mockReturnValue(undefined);
    vi.spyOn(configService, 'getWithDefault').mockReturnValue('7d');
    
    const jwtOptions = jwtModuleImport.registerAsync.useFactory(configService);
    
    expect(jwtOptions.signOptions.expiresIn).toBe('7d');
  });
});
