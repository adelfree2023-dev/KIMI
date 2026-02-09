/**
 * Auth Service Tests
 * Rule 4.1: Test Coverage Mandate
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService, type AuthUser, type JwtPayload } from './auth.service.js';

// Mock JwtService
const mockJwtService = {
  sign: vi.fn(),
  verify: vi.fn(),
};

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService(mockJwtService as any);
  });

  describe('generateToken', () => {
    it('should generate token for valid user', async () => {
      const user: AuthUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
      };

      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const token = await authService.generateToken(user);

      expect(token).toBe('mock-jwt-token');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId,
      });
    });

    it('should generate token without tenantId', async () => {
      const user: AuthUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
      };

      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const token = await authService.generateToken(user);

      expect(token).toBe('mock-jwt-token');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        tenantId: undefined,
      });
    });
  });

  describe('validateUser', () => {
    it('should validate user with valid payload', async () => {
      const payload: JwtPayload = {
        sub: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
      };

      const user = await authService.validateUser(payload);

      expect(user).toEqual({
        id: payload.sub,
        email: payload.email,
        tenantId: payload.tenantId,
      });
    });

    it('should throw for payload without sub', async () => {
      const payload = {
        email: 'test@example.com',
      } as JwtPayload;

      await expect(authService.validateUser(payload)).rejects.toThrow(
        'Invalid token payload'
      );
    });

    it('should handle payload without tenantId', async () => {
      const payload: JwtPayload = {
        sub: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
      };

      const user = await authService.validateUser(payload);

      expect(user).toEqual({
        id: payload.sub,
        email: payload.email,
        tenantId: undefined,
      });
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const mockPayload: JwtPayload = {
        sub: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
      };

      mockJwtService.verify.mockReturnValue(mockPayload);

      const result = await authService.verifyToken('valid-token');

      expect(result).toEqual(mockPayload);
      expect(mockJwtService.verify).toHaveBeenCalledWith('valid-token');
    });

    it('should throw for invalid token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.verifyToken('invalid-token')).rejects.toThrow(
        'Invalid token'
      );
    });

    it('should throw for expired token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      await expect(authService.verifyToken('expired-token')).rejects.toThrow(
        'Invalid token'
      );
    });
  });
});
