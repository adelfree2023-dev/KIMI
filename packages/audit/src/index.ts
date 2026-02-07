/**
 * @apex/audit
 * S4 Protocol: Immutable Audit Logging
 *
 * Provides compliance-grade audit trail for all security-relevant operations
 */

export {
  type AuditAction,
  // Types
  type AuditLogEntry,
  type AuditQueryOptions,
  type AuditSeverity,
  initializeAuditTable,
  // Core functions
  log,
  logProvisioning,
  logSecurityEvent,
  query,
} from './audit.service.js';
