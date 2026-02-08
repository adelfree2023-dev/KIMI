
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GlobalExceptionFilter, OperationalError } from './exception-filter.js';
import { ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ZodError } from 'zod';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockJson: any;
  let mockStatus: any;
  let mockResponse: any;
  let mockRequest: any;
  let mockArgumentsHost: any;

  beforeEach(() => {
    vi.clearAllMocks();
    filter = new GlobalExceptionFilter();

    // Spy on logger
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => { });
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => { });

    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    mockResponse = {
      status: mockStatus,
    };
    mockRequest = {
      url: '/test-url',
      method: 'GET',
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
    };

    mockArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should handle HttpException', () => {
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: HttpStatus.FORBIDDEN,
      message: 'Forbidden',
      error: 'Forbidden',
      path: '/test-url',
    }));
  });

  it('should handle HttpException with object response', () => {
    const responseObj = { message: 'Custom Error', error: 'Custom' };
    const exception = new HttpException(responseObj, HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Custom Error',
      error: 'Custom',
    }));
  });

  it('should handle ZodError', () => {
    const zodError = new ZodError([{
      code: 'invalid_type',
      expected: 'string',
      received: 'number',
      path: ['field'],
      message: 'Expected string'
    }]);
    filter.catch(zodError, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: HttpStatus.BAD_REQUEST,
      message: expect.stringContaining('Validation failed'),
      error: 'Bad Request',
    }));
  });

  it('should handle unknown errors as Internal Server Error', () => {
    const exception = new Error('Something went wrong');
    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred', // Sanitized
      error: 'Internal Server Error',
      path: expect.any(String),
      requestId: expect.any(String),
      timestamp: expect.any(String),
    }));
  });

  it('should sanitize 500 errors', () => {
    const exception = new Error('Database connection failed');
    filter.catch(exception, mockArgumentsHost);

    expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
      message: 'An unexpected error occurred',
      statusCode: 500,
    }));
  });

  it('should sanitize sensitive internal details in 4xx errors', () => {
    const exception = new HttpException('Invalid column "password" in table "users"', HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockArgumentsHost);

    expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Invalid request', // Sanitized
    }));
  });

  it('should include stack trace in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const exception = new Error('Test Error');
    filter.catch(exception, mockArgumentsHost);

    expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
      stack: expect.any(String),
    }));

    process.env.NODE_ENV = originalEnv;
  });

  it('should NOT include stack trace in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const exception = new Error('Test Error');
    filter.catch(exception, mockArgumentsHost);

    expect(mockJson).toHaveBeenCalledWith(expect.not.objectContaining({
      stack: expect.anything(),
    }));

    process.env.NODE_ENV = originalEnv;
  });
});

describe('OperationalError', () => {
  it('should be instance of HttpException', () => {
    const error = new OperationalError('Ops error');
    expect(error).toBeInstanceOf(HttpException);
    expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
  });
});
