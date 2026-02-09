/**
 * JWT Strategy Tests
 * Rule 4.1: Test Coverage Mandate
 */

import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JwtStrategy } from './jwt.strategy.js';

const mockConfigService = {
  get: vi.fn(),
};

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService.get.mockReturnValue('test-jwt-secret-32-chars-longgg');
    strategy = new JwtStrategy(mockConfigService as any);
  });

  describe('constructor', () => {
    it('should create strategy with config service', () => {
      expect(strategy).toBeDefined();
    });

    it('should get JWT_SECRET from config', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
    });
  });

  describe('validate', () => {
    it('should validate and return user from payload', async () => {
      const payload = {
        sub: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: payload.sub,
        email: payload.email,
        tenantId: payload.tenantId,
      });
    });

    it('should throw UnauthorizedException for payload without sub', async () => {
      const payload = {
        email: 'test@example.com',
      };

      await expect(strategy.validate(payload as any)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException for null payload', async () => {
      await expect(strategy.validate(null as any)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException for undefined sub', async () => {
      const payload = {
        sub: undefined,
        email: 'test@example.com',
      };

      await expect(strategy.validate(payload as any)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should handle payload without tenantId', async () => {
      const payload = {
        sub: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: payload.sub,
        email: payload.email,
        tenantId: undefined,
      });
    });
  });
});
