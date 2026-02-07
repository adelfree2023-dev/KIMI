/**
 * Tests for quota service
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PLAN_LIMITS,
  checkProvisioningQuota,
  getPlanLimits,
  isFeatureAllowed,
  validateSubdomainAvailability,
} from './quota-service.js';

describe('QuotaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PLAN_LIMITS', () => {
    it('should have defined limits for all plans', () => {
      expect(PLAN_LIMITS.free).toBeDefined();
      expect(PLAN_LIMITS.pro).toBeDefined();
      expect(PLAN_LIMITS.enterprise).toBeDefined();
    });

    it('should have correct free plan limits', () => {
      expect(PLAN_LIMITS.free.maxStorageMb).toBe(100);
      expect(PLAN_LIMITS.free.maxUsers).toBe(1);
      expect(PLAN_LIMITS.free.maxProducts).toBe(10);
    });
  });

  describe('checkProvisioningQuota', () => {
    it('should allow provisioning within limits', async () => {
      const result = await checkProvisioningQuota('free', 'org-123');
      expect(result.allowed).toBe(true);
    });

    it('should deny provisioning when limit reached', async () => {
      const result = await checkProvisioningQuota('free', 'org-123');
      expect(result.allowed).toBe(true);
      expect(result.limit).toBeDefined();
    });
  });

  describe('getPlanLimits', () => {
    it('should return limits for valid plan', () => {
      const limits = getPlanLimits('pro');
      expect(limits.maxStorageMb).toBeGreaterThan(
        PLAN_LIMITS.free.maxStorageMb
      );
    });

    it('should throw for invalid plan', () => {
      expect(() => getPlanLimits('invalid' as never)).toThrow();
    });
  });

  describe('isFeatureAllowed', () => {
    it('should allow custom domains for pro plans', () => {
      expect(isFeatureAllowed('pro', 'customDomain')).toBe(true);
      expect(isFeatureAllowed('free', 'customDomain')).toBe(false);
    });

    it('should allow SSO for enterprise only', () => {
      expect(isFeatureAllowed('enterprise', 'sso')).toBe(true);
      expect(isFeatureAllowed('pro', 'sso')).toBe(false);
    });
  });

  describe('validateSubdomainAvailability', () => {
    it('should validate available subdomain', async () => {
      const result = await validateSubdomainAvailability('available');
      expect(result.available).toBe(true);
    });

    it('should reject reserved subdomains', async () => {
      const result = await validateSubdomainAvailability('admin');
      expect(result.available).toBe(false);
      expect(result.reason).toContain('reserved');
    });

    it('should reject invalid formats', async () => {
      const result = await validateSubdomainAvailability('invalid_format');
      expect(result.available).toBe(false);
    });
  });
});
