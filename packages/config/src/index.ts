/**
 * S1: Environment Verification Protocol
 * Constitution Reference: Article S1
 * Rule: Application MUST crash on invalid environment configuration
 */

import { z } from 'zod';

/**
 * Zod Schema for Environment Variables (Single Source of Truth)
 * Strict validation with no coercion
 */
export const EnvSchema = z.object({
  // Critical Security Variables
  JWT_SECRET: z
    .string()
    .min(32, 'S1 Violation: JWT_SECRET must be at least 32 characters')
    .regex(
      /^[A-Za-z0-9-_]+$/,
      'S1 Violation: JWT_SECRET contains invalid characters'
    ),

  JWT_EXPIRES_IN: z.string().default('7d'),

  // Database Configuration
  DATABASE_URL: z
    .string()
    .url('S1 Violation: DATABASE_URL must be a valid URL')
    .startsWith('postgresql://', 'S1 Violation: Only PostgreSQL is supported'),

  // Redis Configuration
  REDIS_URL: z
    .string()
    .url('S1 Violation: REDIS_URL must be a valid URL')
    .default('redis://localhost:6379'),

  // MinIO/S3 Configuration
  MINIO_ENDPOINT: z.string().min(1),
  MINIO_PORT: z.string().default('9000'),
  MINIO_USE_SSL: z.enum(['true', 'false']).default('false'),
  MINIO_ACCESS_KEY: z.string().min(3),
  MINIO_SECRET_KEY: z.string().min(8),
  MINIO_BUCKET_NAME: z.string().default('apex-assets'),
  MINIO_REGION: z.string().default('us-east-1'),

  // Application Settings
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  PORT: z.string().default('3000'),

  // Rate Limiting (S6)
  RATE_LIMIT_TTL: z.string().default('60'),
  RATE_LIMIT_MAX: z.string().default('100'),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

/**
 * Validates environment variables at boot time
 * @throws Error with 'S1 Violation' prefix on validation failure
 * @returns Validated environment configuration
 */
export function validateEnv(): EnvConfig {
  try {
    const parsed = EnvSchema.parse(process.env);

    // Additional S1 Security Checks
    if (parsed.NODE_ENV === 'production') {
      if (
        parsed.JWT_SECRET.includes('default') ||
        parsed.JWT_SECRET.includes('test')
      ) {
        throw new Error(
          'S1 Violation: JWT_SECRET appears to be a default/test value in production'
        );
      }

      if (
        parsed.DATABASE_URL.includes('localhost') &&
        !parsed.DATABASE_URL.includes('ssl')
      ) {
        throw new Error('S1 Violation: Production database must use SSL');
      }
    }

    console.warn(
      '✅ S1 Compliance: Environment variables validated successfully'
    );
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      throw new Error(
        `S1 Violation: Environment validation failed - ${issues}`
      );
    }
    throw error;
  }
}

/**
 * Boot-time environment checker
 * Usage: Import this at the very top of your main.ts
 * Effect: Application will crash immediately if env is invalid
 */
export function enforceS1Compliance(): void {
  try {
    validateEnv();
  } catch (error) {
    console.error('❌ CRITICAL: S1 Protocol Violation');
    console.error(error instanceof Error ? error.message : 'Unknown error');
    console.error('Application startup aborted. Check your .env file.');
    process.exit(1);
  }
}

// Auto-execute on import for fail-fast behavior
// CRITICAL FIX (S1): Always enforce in production, respect flag only in non-production
if (process.env.NODE_ENV === 'production') {
  // In production, S1 is ALWAYS enforced - no bypass allowed
  enforceS1Compliance();
} else if (process.env.NODE_ENV === 'test') {
  // In test environment, we don't auto-enforce to allow unit tests to run without full env
  console.warn('⚠️ S1 Compliance: Skipping automatic enforcement in test environment');
} else if (process.env.ENABLE_S1_ENFORCEMENT !== 'false') {
  // In non-production, respect the flag (default to enforce)
  enforceS1Compliance();
}

/**
 * Cached environment configuration
 * Use this for direct access to env vars after validation
 * In test environment, if validation fails, we provide a partial mock to prevent crash on import
 */
export const env: EnvConfig = (() => {
  try {
    return validateEnv();
  } catch (error) {
    if (process.env.NODE_ENV === 'test') {
      console.warn('⚠️ S1 Compliance: Environment validation failed, using test defaults');
      return {
        JWT_SECRET: 'test-secret-at-least-32-chars-long-!!!',
        DATABASE_URL: 'postgresql://localhost:5432/test',
        REDIS_URL: 'redis://localhost:6379',
        MINIO_ENDPOINT: 'localhost',
        MINIO_ACCESS_KEY: 'minioadmin',
        MINIO_SECRET_KEY: 'minioadmin',
        NODE_ENV: 'test',
      } as EnvConfig;
    }
    throw error;
  }
})();

/**
 * NestJS-compatible ConfigService
 * Provides typed access to environment variables
 */
export class ConfigService {
  private readonly config: EnvConfig;

  constructor() {
    this.config = env;
  }

  /**
   * Get a configuration value by key
   */
  get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    return this.config[key];
  }

  /**
   * Get a configuration value with a default fallback
   */
  getWithDefault<K extends keyof EnvConfig>(
    key: K,
    defaultValue: EnvConfig[K]
  ): EnvConfig[K] {
    return this.config[key] ?? defaultValue;
  }
}
