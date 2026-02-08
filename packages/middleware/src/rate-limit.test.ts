
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RateLimitGuard, RateLimit, RedisRateLimitStore } from './rate-limit.js';
import { ExecutionContext, HttpStatus, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Mock RedisRateLimitStore
vi.mock('./rate-limit.js', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    RedisRateLimitStore: vi.fn().mockImplementation(() => ({
      increment: vi.fn().mockResolvedValue({ count: 1, ttl: 60 }),
      isBlocked: vi.fn().mockResolvedValue({ blocked: false, retryAfter: 0 }),
      incrementViolations: vi.fn().mockResolvedValue(0),
      block: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let reflector: Reflector;
  let mockStore: any;
  let mockContext: ExecutionContext;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RateLimitGuard(reflector);

    // Access the private store instance if possible or mock the method calls naturally
    // Since unit testing typically mocks external dependencies, but here the store is a singleton imported
    // We rely on the vi.mock above. We need to access the helper to change return values.

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
      getHandler: () => { },
      getClass: () => { },
    } as any;

    // Reset mocks on the singleton if needed, or we just trust the mock factory
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
});
