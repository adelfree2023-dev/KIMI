import { describe, expect, it } from 'vitest';
import { buttonStyles, cn, inputStyles, theme } from './index.js';

describe('UI Package', () => {
  describe('cn helper', () => {
    it('should combine class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should filter falsy values', () => {
      expect(cn('class1', null, undefined, false, 'class2')).toBe(
        'class1 class2'
      );
    });
  });

  describe('buttonStyles', () => {
    it('should have base styles', () => {
      expect(buttonStyles.base).toContain('inline-flex');
    });

    it('should have variant styles', () => {
      expect(buttonStyles.variants.primary).toContain('bg-primary-600');
      expect(buttonStyles.variants.danger).toContain('bg-red-600');
    });

    it('should have size styles', () => {
      expect(buttonStyles.sizes.sm).toContain('h-8');
      expect(buttonStyles.sizes.lg).toContain('h-12');
    });
  });

  describe('inputStyles', () => {
    it('should have base styles', () => {
      expect(inputStyles.base).toContain('rounded-md');
    });

    it('should have error styles', () => {
      expect(inputStyles.error).toContain('border-red-500');
    });
  });

  describe('theme', () => {
    it('should have primary colors', () => {
      expect(theme.colors.primary[500]).toBe('#3b82f6');
    });

    it('should have gray colors', () => {
      expect(theme.colors.gray[500]).toBe('#6b7280');
    });
  });
});
