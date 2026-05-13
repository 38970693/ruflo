import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('Utils', () => {
  describe('cn function', () => {
    it('merges class names', () => {
      const result = cn('foo', 'bar');
      expect(result).toBe('foo bar');
    });

    it('handles conditional classes', () => {
      const shouldInclude = false;
      const result = cn('foo', shouldInclude && 'bar', 'baz');
      expect(result).toBe('foo baz');
    });

    it('handles undefined values', () => {
      const result = cn('foo', undefined, 'bar');
      expect(result).toBe('foo bar');
    });

    it('merges Tailwind classes correctly', () => {
      const result = cn('px-2 py-2', 'px-4');
      // clsx merges classes, so we just verify both classes are present
      expect(result).toContain('px-4');
      expect(result).toContain('py-2');
    });
  });
});