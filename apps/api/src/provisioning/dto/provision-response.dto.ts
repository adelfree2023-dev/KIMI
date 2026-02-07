import { z } from 'zod';

export const ProvisionResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    tenantId: z.string().uuid(),
    subdomain: z.string(),
    storeUrl: z.string().url(),
    adminPanelUrl: z.string().url(),
    apiEndpoint: z.string().url(),
    adminCredentials: z.object({
      email: z.string().email(),
      temporaryPassword: z.string(),
      mustChangePassword: z.boolean(),
    }),
    resources: z.object({
      databaseSchema: z.string(),
      storageBucket: z.string(),
      maxProducts: z.number().int(),
      maxStorageGB: z.number(),
    }),
    provisioningTimeMs: z.number().int(),
  }),
  warnings: z.array(z.string()).optional(),
  meta: z.object({
    timestamp: z.string().datetime(),
    requestId: z.string().uuid(),
  }),
});

export type ProvisionResponseDto = z.infer<typeof ProvisionResponseSchema>;

export const ProvisionErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.enum([
      'VALIDATION_ERROR',
      'QUOTA_EXCEEDED',
      'ALREADY_EXISTS',
      'RATE_LIMITED',
      'INTERNAL_ERROR',
      'UNAUTHORIZED',
    ]),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
  meta: z.object({
    timestamp: z.string().datetime(),
    requestId: z.string().uuid(),
  }),
});

export type ProvisionErrorDto = z.infer<typeof ProvisionErrorSchema>;
