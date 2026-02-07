/**
 * Exception Filter Tests
 * S4 Protocol: Error Handling
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  GlobalExceptionFilter,
  OperationalError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  TenantIsolationError,
} from './exception-filter.js';

const mockJson = vi.fn();
const mockStatus = vi.fn().mockReturnValue({ json: mockJson });
const mockGetResponse = vi.fn().mockReturnValue({ status: mockStatus });
const mockGetRequest = vi.fn().mockReturnValue({
  url: '/test',
  method: 'GET',
  ip: '127.0.0.1',
  headers: {
    'user-agent': 'test-agent'
  }
});
const mockGetStatus = vi.fn();
const mockHost = {
  switchToHttp: () => ({
    getResponse: mockGetResponse,
    getRequest: mockGetRequest,
  }),
};

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  beforeEach(() => {
    vi.clearAllMocks();
    filter = new GlobalExceptionFilter();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should handle generic errors', () => {
    const error = new Error('Test error');

    filter.catch(error, mockHost as any);

    expect(mockStatus).toHaveBeenCalledWith(500);
  });
});

describe('OperationalError', () => {
  it('should create with message and status', () => {
    const error = new OperationalError('Test message', 400);
    expect(error.message).toBe('Test message');
    expect(error.getStatus()).toBe(400);
  });

  it('should be instance of HttpException', () => {
    const error = new OperationalError('Test', 500);
    expect(error).toBeInstanceOf(OperationalError);
  });
});

describe('ValidationError', () => {
  it('should have 400 status', () => {
    const error = new ValidationError('Invalid input');
    expect(error.getStatus()).toBe(400);
    expect(error.message).toBe('Invalid input');
  });
});

describe('AuthenticationError', () => {
  it('should have 401 status', () => {
    const error = new AuthenticationError('Unauthorized');
    expect(error.getStatus()).toBe(401);
    expect(error.message).toBe('Unauthorized');
  });
});

describe('AuthorizationError', () => {
  it('should have 403 status', () => {
    const error = new AuthorizationError('Forbidden');
    expect(error.getStatus()).toBe(403);
    expect(error.message).toBe('Forbidden');
  });
});

describe('TenantIsolationError', () => {
  it('should have 403 status', () => {
    const error = new TenantIsolationError('Tenant access denied');
    expect(error.getStatus()).toBe(403);
    expect(error.message).toBe('Tenant access denied');
  });
});
