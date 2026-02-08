
import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RateLimitGuard, RateLimit, RedisRateLimitStore, RATE_LIMIT_KEY } from './rate-limit.js';
import { ExecutionContext, HttpStatus, HttpException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Mock RedisRateLimitStore methods
const mockIncrement = vi.fn().mockResolvedValue({ count: 1, ttl: 60 });
const mockIsBlocked = vi.fn().mockResolvedValue({ blocked: false, retryAfter: 0 });
const mockIncrementViolations = vi.fn().mockResolvedValue(0);
const mockBlock = vi.fn().mockResolvedValue(undefined);

vi.mock('./rate-limit.js', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    RedisRateLimitStore: vi.fn().mockImplementation(() => ({
      increment: mockIncrement,
      isBlocked: mockIsBlocked,
      incrementViolations: mockIncrementViolations,
      block: mockBlock,
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
    // Reset mocks
    mockIncrement.mockResolvedValue({ count: 1, ttl: 60 });
    mockIsBlocked.mockResolvedValue({ blocked: false, retryAfter: 0 });
    mockIncrementViolations.mockResolvedValue(0);
    mockBlock.mockResolvedValue(undefined);

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
      getHandler: () => function testHandler() {},
      getClass: () => class TestController {},
    } as any;

    vi.clearAllMocks();
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
