/**
 * Security Tests
 * S3 Protocol: Security Headers
 */

import { describe, expect, it } from 'vitest';
import {
  securityHeaders,
  SecurityHeadersMiddleware,
  defaultCorsConfig,
  getTenantCorsConfig,
  CsrfProtection,
  CsrfGuard,
  helmetConfig,
} from './security.js';

describe('securityHeaders', () => {
  it('should have X-Content-Type-Options', () => {
    expect(securityHeaders['X-Content-Type-Options']).toBe('nosniff');
  });

  it('should have X-Frame-Options', () => {
    expect(securityHeaders['X-Frame-Options']).toBe('DENY');
  });

  it('should have X-XSS-Protection', () => {
    expect(securityHeaders['X-XSS-Protection']).toBe('1; mode=block');
  });

  it('should have Referrer-Policy', () => {
    expect(securityHeaders['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });

  it('should have Permissions-Policy', () => {
    expect(securityHeaders['Permissions-Policy']).toContain('camera=()');
  });

  it('should have Strict-Transport-Security', () => {
    expect(securityHeaders['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains; preload');
  });
});

describe('SecurityHeadersMiddleware', () => {
  it('should be defined', () => {
    expect(SecurityHeadersMiddleware).toBeDefined();
  });
});

describe('defaultCorsConfig', () => {
  it('should have credentials enabled', () => {
    expect(defaultCorsConfig.credentials).toBe(true);
  });

  it('should have correct methods', () => {
    expect(defaultCorsConfig.methods).toContain('GET');
    expect(defaultCorsConfig.methods).toContain('POST');
    expect(defaultCorsConfig.methods).toContain('PUT');
    expect(defaultCorsConfig.methods).toContain('DELETE');
    expect(defaultCorsConfig.methods).toContain('PATCH');
  });

  it('should have allowed headers', () => {
    expect(defaultCorsConfig.allowedHeaders).toContain('Content-Type');
    expect(defaultCorsConfig.allowedHeaders).toContain('Authorization');
    expect(defaultCorsConfig.allowedHeaders).toContain('X-Tenant-ID');
  });
});

describe('getTenantCorsConfig', () => {
  it('should return config with tenant origin', () => {
    const config = getTenantCorsConfig('coffee.apex.com');
    expect(config.origin).toContain('https://coffee.apex.com');
  });

  it('should preserve other settings', () => {
    const config = getTenantCorsConfig('test.apex.com');
    expect(config.credentials).toBe(true);
    expect(config.methods).toContain('GET');
  });
});

describe('CsrfProtection', () => {
  it('should be defined', () => {
    expect(CsrfProtection).toBeDefined();
  });
});

describe('CsrfGuard', () => {
  it('should be defined', () => {
    expect(CsrfGuard).toBeDefined();
  });
});

describe('helmetConfig', () => {
  it('should have contentSecurityPolicy', () => {
    expect(helmetConfig.contentSecurityPolicy).toBeDefined();
  });

  it('should have crossOriginEmbedderPolicy', () => {
    expect(helmetConfig.crossOriginEmbedderPolicy).toBe(false);
  });
});
