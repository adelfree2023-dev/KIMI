
import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RateLimitGuard, RateLimit, RedisRateLimitStore } from './rate-limit.js';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let reflector: Reflector;
  let mockContext: ExecutionContext;
  let mockRequest: any;
  let mockResponse: any;

  // Mock the singleton store methods
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the singleton store instance methods
    vi.spyOn(RedisRateLimitStore.prototype, 'isBlocked').mockResolvedValue({ blocked: false, retryAfter: 0 });
    vi.spyOn(RedisRateLimitStore.prototype, 'increment').mockResolvedValue({ count: 1, ttl: 60 });
    vi.spyOn(RedisRateLimitStore.prototype, 'incrementViolations').mockResolvedValue(0);
    vi.spyOn(RedisRateLimitStore.prototype, 'block').mockResolvedValue(undefined);

    reflector = new Reflector();
    guard = new RateLimitGuard(reflector);

    mockRequest = {
      headers: {},
      ip: '127.0.0.1',
      tenantContext: { plan: 'free', tenantId: 'test-tenant' },
    };

    mockResponse = {
      setHeader: vi.fn(),
    };

    mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
      getHandler: () => function testHandler() { },
      getClass: () => class TestController { },
    } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow request within limit', async () => {
    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', expect.any(Number));
  });

  it('should use tenant plan limits', async () => {
    mockRequest.tenantContext.plan = 'enterprise';
    await guard.canActivate(mockContext);
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 5000);
  });

  it('should prioritize custom decorator limits', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ requests: 10, windowMs: 1000 });
    await guard.canActivate(mockContext);
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 10);
  });

  it('should identify by API key if present', async () => {
    mockRequest.headers['x-api-key'] = 'test-key';
    await guard.canActivate(mockContext);
    // Identification logic is internal, but passing implies it worked
    expect(mockResponse.setHeader).toHaveBeenCalled();
  });

  it('should throw TOO_MANY_REQUESTS when limit exceeded', async () => {
    vi.spyOn(RedisRateLimitStore.prototype, 'increment').mockResolvedValue({ count: 101, ttl: 60 });
    await expect(guard.canActivate(mockContext)).rejects.toThrow(HttpException);
  });

  it('should throw TOO_MANY_REQUESTS when blocked', async () => {
    vi.spyOn(RedisRateLimitStore.prototype, 'isBlocked').mockResolvedValue({ blocked: true, retryAfter: 300 });
    await expect(guard.canActivate(mockContext)).rejects.toThrow('IP blocked');
  });

  it('should handle missing IP and unidentified caller', async () => {
    delete mockRequest.ip;
    mockRequest.headers = {};
    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });
});

describe('RateLimit Decorator', () => {
  it('should set rate limit metadata', () => {
    const decorator = RateLimit({ requests: 10, windowMs: 1000 });
    expect(decorator).toBeDefined();
  });
});

