export {
  type AuditAction,
  type AuditLogEntry,
  type AuditQueryOptions,
  type AuditSeverity,
  initializeAuditTable,
  log,
  logProvisioning,
  logSecurityEvent,
  query,
  AuditService, // Added missing export
} from './audit.service';