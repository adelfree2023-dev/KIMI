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
    const decorator = RateLimit({ ttl: 60, limit: 100 });
    expect(typeof decorator).toBe('function');
  });
});

describe('ThrottleConfig', () => {
  it('should have default config', () => {
    expect(ThrottleConfig.DEFAULT).toBeDefined();
    expect(ThrottleConfig.DEFAULT.ttl).toBe(60);
    expect(ThrottleConfig.DEFAULT.limit).toBe(100);
  });

  it('should have strict config', () => {
    expect(ThrottleConfig.STRICT).toBeDefined();
    expect(ThrottleConfig.STRICT.ttl).toBe(60);
    expect(ThrottleConfig.STRICT.limit).toBe(20);
  });

  it('should have lenient config', () => {
    expect(ThrottleConfig.LENIENT).toBeDefined();
    expect(ThrottleConfig.LENIENT.ttl).toBe(60);
    expect(ThrottleConfig.LENIENT.limit).toBe(200);
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
      ttl: 60,
      limit: 100,
      keyPrefix: 'test',
    };
    expect(config.ttl).toBe(60);
    expect(config.limit).toBe(100);
  });
});
