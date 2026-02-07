/**
 * Tenant Schema - Zod Validation (Rule 5.1)
 * S3 Protocol: Input Validation
 */

import { z } from 'zod';

/**
 * Tenant creation request schema
 */
export const CreateTenantSchema = z.object({
  subdomain: z
    .string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(30, 'Subdomain must be at most 30 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Subdomain must be lowercase alphanumeric and hyphens only'
    ),
  name: z.string().min(2).max(100),
  adminEmail: z.string().email(),
  plan: z.enum(['free', 'basic', 'pro', 'enterprise']).default('free'),
});

export type CreateTenantDto = z.infer<typeof CreateTenantSchema>;

/**
 * Tenant response schema
 */
export const TenantResponseSchema = z.object({
  id: z.string().uuid(),
  subdomain: z.string(),
  name: z.string(),
  plan: z.enum(['free', 'basic', 'pro', 'enterprise']),
  status: z.enum(['active', 'suspended', 'pending']),
  createdAt: z.string().datetime(),
});

export type TenantResponseDto = z.infer<typeof TenantResponseSchema>;

/**
 * Update tenant schema
 */
export const UpdateTenantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  plan: z.enum(['free', 'basic', 'pro', 'enterprise']).optional(),
  status: z.enum(['active', 'suspended', 'pending']).optional(),
});

export type UpdateTenantDto = z.infer<typeof UpdateTenantSchema>;
