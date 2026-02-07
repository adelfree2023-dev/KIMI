/**
 * Auth Schema Tests
 * Rule 5.1: Zod Schema Validation
 */

import { describe, expect, it } from 'vitest';
import {
  LoginSchema,
  RegisterSchema,
  JwtPayloadSchema,
  type LoginDto,
  type RegisterDto,
  type JwtPayloadDto,
} from './auth.schema.js';

describe('Auth Schema Validation', () => {
  describe('LoginSchema', () => {
    it('should validate valid login credentials', () => {
      const validLogin = {
        email: 'user@example.com',
        password: 'securepassword123',
      };

      const result = LoginSchema.safeParse(validLogin);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidLogin = {
        email: 'invalid-email',
        password: 'securepassword123',
      };

      const result = LoginSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const invalidLogin = {
        email: 'user@example.com',
        password: 'short',
      };

      const result = LoginSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
    });

    it('should reject missing email', () => {
      const invalidLogin = {
        password: 'securepassword123',
      };

      const result = LoginSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const invalidLogin = {
        email: 'user@example.com',
      };

      const result = LoginSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
    });

    it('should infer correct type', () => {
      const login: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      expect(login.email).toBe('test@example.com');
    });
  });

  describe('RegisterSchema', () => {
    it('should validate valid registration data', () => {
      const validRegister = {
        email: 'user@example.com',
        password: 'SecurePass123',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = RegisterSchema.safeParse(validRegister);
      expect(result.success).toBe(true);
    });

    it('should reject password without uppercase', () => {
      const invalidRegister = {
        email: 'user@example.com',
        password: 'securepass123',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = RegisterSchema.safeParse(invalidRegister);
      expect(result.success).toBe(false);
    });

    it('should reject password without lowercase', () => {
      const invalidRegister = {
        email: 'user@example.com',
        password: 'SECUREPASS123',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = RegisterSchema.safeParse(invalidRegister);
      expect(result.success).toBe(false);
    });

    it('should reject password without number', () => {
      const invalidRegister = {
        email: 'user@example.com',
        password: 'SecurePass',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = RegisterSchema.safeParse(invalidRegister);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const invalidRegister = {
        email: 'user@example.com',
        password: 'Short1',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = RegisterSchema.safeParse(invalidRegister);
      expect(result.success).toBe(false);
    });

    it('should reject invalid tenantId', () => {
      const invalidRegister = {
        email: 'user@example.com',
        password: 'SecurePass123',
        tenantId: 'invalid-uuid',
      };

      const result = RegisterSchema.safeParse(invalidRegister);
      expect(result.success).toBe(false);
    });

    it('should infer correct type', () => {
      const register: RegisterDto = {
        email: 'test@example.com',
        password: 'SecurePass123',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
      };
      expect(register.tenantId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('JwtPayloadSchema', () => {
    it('should validate valid JWT payload', () => {
      const validPayload = {
        sub: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@example.com',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'admin',
        iat: 1234567890,
        exp: 1234567990,
      };

      const result = JwtPayloadSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should reject invalid sub (user id)', () => {
      const invalidPayload = {
        sub: 'invalid-uuid',
        email: 'user@example.com',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'admin',
        iat: 1234567890,
        exp: 1234567990,
      };

      const result = JwtPayloadSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should reject invalid role', () => {
      const invalidPayload = {
        sub: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@example.com',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'invalid_role',
        iat: 1234567890,
        exp: 1234567990,
      };

      const result = JwtPayloadSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should accept all valid roles', () => {
      const roles = ['admin', 'staff', 'user', 'super_admin'];

      for (const role of roles) {
        const payload = {
          sub: '550e8400-e29b-41d4-a716-446655440000',
          email: 'user@example.com',
          tenantId: '550e8400-e29b-41d4-a716-446655440000',
          role,
          iat: 1234567890,
          exp: 1234567990,
        };

        const result = JwtPayloadSchema.safeParse(payload);
        expect(result.success).toBe(true);
      }
    });

    it('should infer correct type', () => {
      const payload: JwtPayloadDto = {
        sub: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'admin',
        iat: 1234567890,
        exp: 1234567990,
      };
      expect(payload.role).toBe('admin');
    });
  });
});
