/**
 * Rate Limit Tests
 * S6 Protocol: Rate Limiting
 */

import { describe, expect, it } from 'vitest';
import {
  RateLimitGuard,
  RateLimit,
  ThrottleConfig,
  RATE_LIMIT_KEY,
  type RateLimitConfig,
} from './rate-limit.js';

describe('RATE_LIMIT_KEY', () => {
  it('should have correct value', () => {
    expect(RATE_LIMIT_KEY).toBe('rate_limit');
  });
});

describe('RateLimit decorator', () => {
  it('should be defined', () => {
    expect(RateLimit).toBeDefined();
  });

  it('should create decorator', () => {
    const decorator = RateLimit({ windowMs: 60000, requests: 100 });
    expect(typeof decorator).toBe('function');
  });
});

describe('ThrottleConfig', () => {
  it('should have default config', () => {
    const defaultConfig = ThrottleConfig.throttlers.find(t => t.name === 'default');
    expect(defaultConfig).toBeDefined();
    expect(defaultConfig?.ttl).toBe(60000);
    expect(defaultConfig?.limit).toBe(100);
  });

  it('should have strict config', () => {
    const strictConfig = ThrottleConfig.throttlers.find(t => t.name === 'strict');
    expect(strictConfig).toBeDefined();
    expect(strictConfig?.ttl).toBe(60000);
    expect(strictConfig?.limit).toBe(10);
  });
});

describe('RateLimitGuard', () => {
  it('should be defined', () => {
    expect(RateLimitGuard).toBeDefined();
  });
});

describe('RateLimitConfig type', () => {
  it('should accept valid config', () => {
    const config: RateLimitConfig = {
      windowMs: 60000,
      requests: 100,
    };
    expect(config.windowMs).toBe(60000);
    expect(config.requests).toBe(100);
  });
});
