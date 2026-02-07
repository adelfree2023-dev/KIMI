/**
 * Auth Schema - Zod Validation (Rule 5.1)
 * S3 Protocol: Input Validation
 */

import { z } from 'zod';

/**
 * Login request schema
 */
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginDto = z.infer<typeof LoginSchema>;

/**
 * Register request schema
 */
export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  tenantId: z.string().uuid(),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;

/**
 * JWT payload schema
 */
export const JwtPayloadSchema = z.object({
  sub: z.string().uuid(), // User ID
  email: z.string().email(),
  tenantId: z.string().uuid(),
  role: z.enum(['admin', 'staff', 'user', 'super_admin']),
  iat: z.number(),
  exp: z.number(),
});

export type JwtPayloadDto = z.infer<typeof JwtPayloadSchema>;
