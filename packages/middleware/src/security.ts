/**
 * S8: Web Security Headers & Configuration
 * Constitution Reference: architecture.md (S8 Protocol)
 * Purpose: CSP, HSTS, CORS, CSRF protection
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Security headers configuration
 */
export const securityHeaders = {
  // Strict Transport Security (HSTS)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Adjust for Next.js
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://api.apex.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // MIME sniffing protection
  'X-Content-Type-Options': 'nosniff',
  
  // XSS protection (legacy but still useful)
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy (formerly Feature-Policy)
  'Permissions-Policy': [
    'accelerometer=()',
    'camera=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'payment=()',
    'usb=()',
  ].join(', '),
};

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(_req: Request, res: Response, next: NextFunction): void {
    // Apply security headers
    for (const [header, value] of Object.entries(securityHeaders)) {
      res.setHeader(header, value);
    }
    
    // Remove headers that leak info
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
    
    next();
  }
}

/**
 * CORS configuration per tenant
 */
export interface CorsConfig {
  origin: string | string[] | boolean;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
}

export const defaultCorsConfig: CorsConfig = {
  origin: false, // Disable by default
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * Dynamic CORS based on tenant domain
 */
export function getTenantCorsConfig(tenantDomain: string): CorsConfig {
  return {
    ...defaultCorsConfig,
    origin: [
      `https://${tenantDomain}`,
      `https://admin.${tenantDomain}`,
      // Add localhost for development
      ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://localhost:3001'] : []),
    ],
  };
}

/**
 * CSRF Protection
 * Double-submit cookie pattern
 */
export class CsrfProtection {
  private readonly tokenName = 'XSRF-TOKEN';
  private readonly headerName = 'X-XSRF-TOKEN';
  
  generateToken(): string {
    return randomBytes(32).toString('hex');
  }
  
  setCookie(res: Response, token: string): void {
    res.cookie(this.tokenName, token, {
      httpOnly: false, // Must be readable by JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
  }
  
  validate(req: Request): boolean {
    const cookieToken = req.cookies?.[this.tokenName];
    const headerToken = req.headers[this.headerName.toLowerCase()];
    
    if (!cookieToken || !headerToken) {
      return false;
    }
    
    return cookieToken === headerToken;
  }
}

import { randomBytes } from 'crypto';

/**
 * NestJS CSRF Guard
 */
import { CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class CsrfGuard implements CanActivate {
  private csrf = new CsrfProtection();
  
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    // Skip for GET/HEAD/OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      // Set new token for safe methods
      const token = this.csrf.generateToken();
      this.csrf.setCookie(response, token);
      return true;
    }
    
    // Validate for state-changing methods
    return this.csrf.validate(request);
  }
}

/**
 * Helmet-like security configuration for NestJS
 */
export const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for API
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
};
