
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
