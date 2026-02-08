/**
 * Rate Limit Tests
 * S6 Protocol: Rate Limiting
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  RateLimitGuard,
  RateLimit,
  ThrottleConfig,
  RATE_LIMIT_KEY,
  type RateLimitConfig,
} from './rate-limit.js';
import { createClient } from 'redis';

// Mock redis
vi.mock('redis', () => ({
  createClient: vi.fn(() => ({
    connect: vi.fn(),
    on: vi.fn(),
    isOpen: true,
    get: vi.fn(),
    set: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
  })),
}));

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
});

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let mockReflector: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReflector = {
      get: vi.fn(),
      getAllAndOverride: vi.fn(),
    };
    guard = new RateLimitGuard(mockReflector as any);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow request if no rate limit is defined', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(null);
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          ip: '127.0.0.1',
          tenantContext: { plan: 'free' },
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };

    const result = await guard.canActivate(mockContext as any);
    expect(result).toBe(true);
  });

  it('should throw TooManyRequests for exceeded limit', async () => {
    process.env.NODE_ENV = 'development'; // Use memory store fallback
    mockReflector.getAllAndOverride.mockReturnValue({ ttl: 60, limit: 1 });

    const mockReq = {
      ip: '127.0.0.1',
      tenantContext: { plan: 'free' },
    };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockReq,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };

    // First request should pass
    await guard.canActivate(mockContext as any);

    // Second request should fail
    await expect(guard.canActivate(mockContext as any)).rejects.toThrow();
  });
});
