import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { enforceS1Compliance, validateEnv, ConfigService, env } from './index.js';

describe('S1: Environment Verification Protocol', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // Mock exit to prevent running tests from exiting
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('JWT_SECRET Validation', () => {
    it('should crash with S1 Violation when JWT_SECRET is missing', () => {
      process.env.JWT_SECRET = undefined;

      expect(() => validateEnv()).toThrow('S1 Violation');
      expect(() => validateEnv()).toThrow('Required');
    });

    it('should crash with S1 Violation when JWT_SECRET is too short (<32 chars)', () => {
      process.env.JWT_SECRET = 'short';

      expect(() => validateEnv()).toThrow('S1 Violation');
      expect(() => validateEnv()).toThrow('at least 32 characters');
    });

    it('should crash with S1 Violation when JWT_SECRET has invalid characters', () => {
      process.env.JWT_SECRET = 'invalid_secret_with_special@chars!';

      expect(() => validateEnv()).toThrow('S1 Violation');
      expect(() => validateEnv()).toThrow('invalid characters');
    });

    it('should pass with valid JWT_SECRET (32+ chars, alphanumeric)', () => {
      process.env.JWT_SECRET = 'valid_secret_key_32_chars_long_1234';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.MINIO_ACCESS_KEY = 'minioadmin';
      process.env.MINIO_SECRET_KEY = 'minioadmin123';

      expect(() => validateEnv()).not.toThrow();
    });
  });

  describe('Production Security Checks', () => {
    it('should crash in production with default JWT_SECRET', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'default_secret_key_32_chars_long_123';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.MINIO_ACCESS_KEY = 'minioadmin';
      process.env.MINIO_SECRET_KEY = 'minioadmin123';

      expect(() => validateEnv()).toThrow('S1 Violation');
      expect(() => validateEnv()).toThrow('default/test value');
    });

    it('should crash in production with localhost DB without SSL', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'valid_production_secret_32_chars_long';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.MINIO_ACCESS_KEY = 'minioadmin';
      process.env.MINIO_SECRET_KEY = 'minioadmin123';

      expect(() => validateEnv()).toThrow('S1 Violation');
      expect(() => validateEnv()).toThrow('SSL');
    });
  });

  describe('enforceS1Compliance', () => {
    it('should call process.exit(1) on validation failure', () => {
      process.env.JWT_SECRET = undefined;

      expect(() => enforceS1Compliance()).toThrow('process.exit called');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe('ConfigService', () => {
    beforeEach(() => {
      process.env.JWT_SECRET = 'valid_secret_key_32_chars_long_1234';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.MINIO_ACCESS_KEY = 'minioadmin';
      process.env.MINIO_SECRET_KEY = 'minioadmin123';
    });

    it('should create ConfigService instance', () => {
      const configService = new ConfigService();
      expect(configService).toBeDefined();
    });

    it('should get config values', () => {
      const configService = new ConfigService();
      expect(configService.get('JWT_SECRET')).toContain('test-secret-for-vitest-purposes-only');
      expect(configService.get('DATABASE_URL')).toBe('postgresql://localhost:5432/test');
    });

    it('should get values with default', () => {
      const configService = new ConfigService();
      expect(configService.getWithDefault('JWT_EXPIRES_IN', '7d')).toBe('1h');
    });
  });

  describe('env export', () => {
    beforeEach(() => {
      process.env.JWT_SECRET = 'valid_secret_key_32_chars_long_1234';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.MINIO_ACCESS_KEY = 'minioadmin';
      process.env.MINIO_SECRET_KEY = 'minioadmin123';
    });

    it('should export env config', () => {
      expect(env).toBeDefined();
      expect(env.JWT_SECRET).toBeDefined();
    });
  });
});
