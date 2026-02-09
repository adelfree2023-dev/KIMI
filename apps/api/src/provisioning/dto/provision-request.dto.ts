/**
 * Provision Request DTO
 */

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ProvisionRequestSchema = z.object({
  /**
   * Unique subdomain for the store (e.g., "coffee-beans")
   */
  subdomain: z
    .string()
    .min(3)
    .max(30)
    .regex(
      /^[a-z0-9-]+$/,
      'Subdomain must be lowercase alphanumeric and hyphens only'
    ),

  /**
   * Display name of the store
   */
  storeName: z.string().min(2).max(100),

  /**
   * Initial administrator email
   */
  adminEmail: z.string().email(),

  /**
   * Plan level for the new tenant
   */
  plan: z.enum(['free', 'basic', 'pro', 'enterprise']).default('free'),

  /**
   * Super Admin secret key (REQUIRED)
   * S3 Validation: Must be 32-128 chars, alphanumeric + hyphen/underscore only
   * CRITICAL FIX (S3): Removed .optional() - key is now mandatory
   */
  superAdminKey: z
    .string({
      required_error: 'Super Admin key is required',
      invalid_type_error: 'Super Admin key must be a string',
    })
    .min(32, 'Super Admin key must be at least 32 characters')
    .max(128, 'Super Admin key too long (max 128)')
    .regex(
      /^[A-Za-z0-9-_]+$/,
      'Super Admin key must be alphanumeric with hyphens/underscores only'
    ),
});

export class ProvisionRequestDto extends createZodDto(ProvisionRequestSchema) {}
