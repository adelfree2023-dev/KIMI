/**
 * @apex/middleware
 * S1-S8 Security Protocols Implementation
 */

// S2: Tenant Resolution & Context Management
export {
  getCurrentTenantContext,
  getCurrentTenantId,
  getTenantContext,
  hasTenantContext,
  requireTenantContext,
  runWithTenantContext,
  type TenantContext,
  tenantStorage,
} from './connection-context.js';

// S2: Tenant Isolation Middleware
export {
  TenantIsolationMiddleware,
  TenantScopedGuard,
  SuperAdminOrTenantGuard,
  type TenantRequest,
} from './tenant-isolation.middleware.js';

// S3: Input Validation (Audit Schema)
export {
  AuditLogSchema,
  CreateAuditLogSchema,
  type AuditLogDto,
  type CreateAuditLogDto,
} from './audit.schema.js';

// S5: Global Exception Filter
export {
  GlobalExceptionFilter,
  OperationalError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  TenantIsolationError,
  type ErrorResponse,
} from './exception-filter.js';

// S6: Rate Limiting
export {
  RateLimitGuard,
  RateLimit,
  ThrottleConfig,
  type RateLimitConfig,
  RATE_LIMIT_KEY,
} from './rate-limit.js';

// S8: Security Headers & CORS
export {
  SecurityHeadersMiddleware,
  securityHeaders,
  defaultCorsConfig,
  getTenantCorsConfig,
  CsrfProtection,
  CsrfGuard,
  helmetConfig,
  type CorsConfig,
} from './security.js';

// Tenant Resolution
export {
  extractTenantFromHost,
  extractTenantFromHeader,
  extractTenantFromJWT,
  resolveTenant,
  type TenantResolutionStrategy,
} from './tenant-resolution.js';
