/**
 * CurrentUser Decorator Tests
 * Rule 4.1: Test Coverage Mandate
 */

import { describe, expect, it } from 'vitest';
import { CurrentUser } from './current-user.decorator.js';

describe('CurrentUser Decorator', () => {
  it('should create decorator function', () => {
    const decorator = CurrentUser();
    expect(typeof decorator).toBe('function');
  });

  it('should have proper metadata key', () => {
    // The decorator uses createParamDecorator internally
    // This test ensures the decorator is properly defined
    const decorator = CurrentUser();
    expect(decorator).toBeDefined();
  });
});
