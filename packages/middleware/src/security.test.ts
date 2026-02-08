
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecurityHeadersMiddleware } from './security.js';
import { NextFunction, Request, Response } from 'express';

describe('SecurityMiddleware', () => {
  let middleware: SecurityHeadersMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    middleware = new SecurityHeadersMiddleware();
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      setHeader: vi.fn(),
      removeHeader: vi.fn(),
    };
    nextFunction = vi.fn();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should set basic security headers', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-DNS-Prefetch-Control', 'off');
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(mockResponse.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should set HSTS header', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Strict-Transport-Security',
      expect.stringContaining('max-age=31536000')
    );
  });

  it('should remove X-Powered-By header', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(mockResponse.removeHeader).toHaveBeenCalledWith('X-Powered-By');
  });

  it('should set CSP headers if configured', () => {
    // Modify implementation to verify CSP logic if needed
    // Default implementation sets a strict CSP
    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Content-Security-Policy',
      expect.stringContaining("default-src 'self'")
    );
  });
});
import { CsrfProtection, CsrfGuard } from './security.js';
import { ExecutionContext } from '@nestjs/common';

describe('CsrfProtection', () => {
  let csrf: CsrfProtection;

  beforeEach(() => {
    csrf = new CsrfProtection();
  });

  it('should generate a 64-char hex token', () => {
    const token = csrf.generateToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it('should set XSRF-TOKEN cookie', () => {
    const mockRes = { cookie: vi.fn() } as unknown as Response;
    csrf.setCookie(mockRes, 'test-token');
    expect(mockRes.cookie).toHaveBeenCalledWith('XSRF-TOKEN', 'test-token', expect.any(Object));
  });

  it('should validate matching tokens', () => {
    const mockReq = {
      cookies: { 'XSRF-TOKEN': 'match' },
      headers: { 'x-xsrf-token': 'match' },
    } as unknown as Request;
    expect(csrf.validate(mockReq)).toBe(true);
  });

  it('should reject non-matching tokens', () => {
    const mockReq = {
      cookies: { 'XSRF-TOKEN': 'match' },
      headers: { 'x-xsrf-token': 'mismatch' },
    } as unknown as Request;
    expect(csrf.validate(mockReq)).toBe(false);
  });

  it('should reject missing tokens', () => {
    const mockReq = {
      cookies: {},
      headers: {},
    } as unknown as Request;
    expect(csrf.validate(mockReq)).toBe(false);
  });
});

describe('CsrfGuard', () => {
  let guard: CsrfGuard;

  beforeEach(() => {
    guard = new CsrfGuard();
  });

  it('should allow GET requests and set cookie', () => {
    const mockReq = { method: 'GET' };
    const mockRes = { cookie: vi.fn() };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockReq,
        getResponse: () => mockRes,
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(mockContext)).toBe(true);
    expect(mockRes.cookie).toHaveBeenCalled();
  });

  it('should validate POST requests', () => {
    const mockReq = {
      method: 'POST',
      cookies: { 'XSRF-TOKEN': 'valid' },
      headers: { 'x-xsrf-token': 'valid' },
    };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockReq,
        getResponse: () => ({}),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(mockContext)).toBe(true);
  });
});
