/**
 * @apex/middleware
 * S2 Protocol: Tenant Resolution & Context Management
 */

export {
  getTenantContext,
  getCurrentTenantContext,
  getCurrentTenantId,
  hasTenantContext,
  requireTenantContext,
  runWithTenantContext,
  type TenantContext,
  tenantStorage,
} from './connection-context.js';
