
import { describe, it, expect, vi } from 'vitest';
import { ExecutionContext } from '@nestjs/common';
import { CurrentUser } from './current-user.decorator.js';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants.js';

describe('CurrentUser Decorator', () => {
  // Helper to get the factory function from the decorator
  function getDecoratorFactory(decorator: Function) {
    class Test {
      public test(@decorator() value: any) { }
    }
    const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test.prototype, 'test');
    return args[Object.keys(args)[0]].factory;
  }

  it('should be defined', () => {
    expect(CurrentUser).toBeDefined();
  });

  it('should return the user object when no data is passed', () => {
    const factory = getDecoratorFactory(CurrentUser);
    const user = { id: '123', email: 'test@example.com' };
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;

    expect(factory(undefined, ctx)).toEqual(user);
  });

  it('should return a specific property when data is passed', () => {
    const factory = getDecoratorFactory(CurrentUser);
    const user = { id: '123', email: 'test@example.com' };
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;

    expect(factory('email', ctx)).toBe('test@example.com');
  });

  it('should return undefined if request has no user', () => {
    const factory = getDecoratorFactory(CurrentUser);
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;

    expect(factory(undefined, ctx)).toBeUndefined();
  });
});
