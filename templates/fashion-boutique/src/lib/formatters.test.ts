/**
 * Formatters Utility Tests
 */

import { describe, expect, it } from 'vitest';
import {
  calculateDiscount,
  formatDate,
  formatPrice,
  truncate,
} from './formatters';

describe('formatPrice', () => {
  it('formats USD correctly', () => {
    expect(formatPrice(99.99, 'USD')).toBe('$99.99');
  });

  it('formats EUR correctly', () => {
    expect(formatPrice(99.99, 'EUR')).toBe('€99.99');
  });

  it('handles zero', () => {
    expect(formatPrice(0, 'USD')).toBe('$0.00');
  });
});

describe('calculateDiscount', () => {
  it('calculates discount percentage correctly', () => {
    expect(calculateDiscount(80, 100)).toBe(20);
  });

  it('returns 0 when no discount', () => {
    expect(calculateDiscount(100, 100)).toBe(0);
  });

  it('returns 0 when compareAtPrice is null', () => {
    expect(calculateDiscount(100, null)).toBe(0);
  });

  it('returns 0 when price is higher than compareAtPrice', () => {
    expect(calculateDiscount(120, 100)).toBe(0);
  });
});

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2026-02-09');
    const formatted = formatDate(date);
    expect(formatted).toContain('February');
    expect(formatted).toContain('2026');
  });
});

describe('truncate', () => {
  it('truncates long text', () => {
    const text = 'This is a very long text that needs truncation';
    expect(truncate(text, 20)).toBe('This is a very long ...');
  });

  it('does not truncate short text', () => {
    const text = 'Short text';
    expect(truncate(text, 20)).toBe('Short text');
  });
});
