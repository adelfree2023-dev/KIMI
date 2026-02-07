/**
 * S6: Rate Limiting Service
 * Constitution Reference: architecture.md (S6 Protocol)
 * Purpose: Dynamic rate limits per tenant tier + DDoS protection
 */

import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';

// Rate limit tiers per plan
const RATE_LIMIT_TIERS = {
  free: { requests: 100, windowMs: 60_000 },      // 100 req/min
  basic: { requests: 500, windowMs: 60_000 },     // 500 req/min
  pro: { requests: 1000, windowMs: 60_000 },      // 1000 req/min
  enterprise: { requests: 5000, windowMs: 60_000 }, // 5000 req/min
} as const;

// In-memory store (use Redis in production)
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
    violations: number;
  };
}

const store: RateLimitStore = {};

export interface RateLimitConfig {
  requests: number;
  windowMs: number;
  blockDurationMs?: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly defaultConfig: RateLimitConfig = {
    requests: 100,
    windowMs: 60_000, // 1 minute
    blockDurationMs: 300_000, // 5 minutes block after violations
  };

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Get client identifier (IP or API key)
    const identifier = this.getIdentifier(request);
    
    // Get tenant tier (default to free)
    const tenantTier = this.getTenantTier(request);
    const tierConfig = RATE_LIMIT_TIERS[tenantTier] || RATE_LIMIT_TIERS.free;
    
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    
    // Check if currently blocked
    const record = store[key];
    if (record) {
      if (record.violations >= 5 && now < record.resetTime) {
        throw new HttpException({
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'IP blocked due to repeated violations',
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        }, HttpStatus.TOO_MANY_REQUESTS);
      }
      
      // Reset if window expired
      if (now > record.resetTime) {
        store[key] = {
          count: 1,
          resetTime: now + tierConfig.windowMs,
          violations: record.violations > 0 ? record.violations - 1 : 0, // Decay violations
        };
        return true;
      }
      
      // Increment count
      record.count++;
      
      if (record.count > tierConfig.requests) {
        // Violation detected
        record.violations++;
        
        // Block after 5 violations
        if (record.violations >= 5) {
          record.resetTime = now + (this.defaultConfig.blockDurationMs || 300_000);
        }
        
        throw new HttpException({
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded',
          limit: tierConfig.requests,
          window: '1 minute',
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        }, HttpStatus.TOO_MANY_REQUESTS);
      }
    } else {
      // First request
      store[key] = {
        count: 1,
        resetTime: now + tierConfig.windowMs,
        violations: 0,
      };
    }
    
    // Add rate limit headers
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', tierConfig.requests);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, tierConfig.requests - store[key].count));
    response.setHeader('X-RateLimit-Reset', Math.ceil(store[key].resetTime / 1000));
    
    return true;
  }

  private getIdentifier(request: Request): string {
    // Use API key if available, otherwise IP
    const apiKey = request.headers['x-api-key'] as string;
    if (apiKey) {
      return `api:${apiKey}`;
    }
    
    // Get IP from various headers (proxy support)
    const ip = 
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.ip ||
      'unknown';
    
    return `ip:${ip.split(',')[0].trim()}`;
  }

  private getTenantTier(request: Request): keyof typeof RATE_LIMIT_TIERS {
    // Extract from tenant context or default to free
    const tenantContext = (request as any).tenantContext;
    return tenantContext?.plan || 'free';
  }
}

/**
 * Decorator for custom rate limits
 */
import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit';

export const RateLimit = (config: Partial<RateLimitConfig>) => 
  SetMetadata(RATE_LIMIT_KEY, config);

/**
 * Throttle configuration for @nestjs/throttler (alternative)
 */
export const ThrottleConfig = {
  throttlers: [
    {
      name: 'default',
      ttl: 60000, // 1 minute
      limit: 100,
    },
    {
      name: 'strict',
      ttl: 60000,
      limit: 10, // For auth endpoints
    },
  ],
};
