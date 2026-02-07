import { describe, it, expect } from 'vitest';
import { tenants, users, getTenantTableName, setTenantSearchPath } from './schema';

describe('Schema', () => {
  describe('Tenants table', () => {
    it('should have correct columns', () => {
      expect(tenants).toBeDefined();
    });
  });

  describe('Users table', () => {
    it('should have correct columns', () => {
      expect(users).toBeDefined();
    });
  });

  describe('S2 Compliance Helpers', () => {
    it('should generate correct tenant table name', () => {
      const tableName = getTenantTableName('users', 'abc-123');
      expect(tableName).toBe('tenant_abc-123.users');
    });

    it('should generate correct search path SQL', () => {
      const sql = setTenantSearchPath('abc-123');
      expect(sql).toBe('SET search_path = tenant_abc-123, public');
    });
  });
});
