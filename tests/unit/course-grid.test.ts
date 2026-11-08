import { describe, expect, it } from 'vitest';
import { courseGridLayout } from '@/components/sections/courses/grid-layout';

describe('courseGridLayout', () => {
  it('uses a single full-width column for one course', () => {
    const l = courseGridLayout(1);
    expect(l.grid).not.toContain('lg:grid-cols-2');
    expect(l.last).toBe('');
  });

  it('uses two columns for two courses (no special last card)', () => {
    const l = courseGridLayout(2);
    expect(l.grid).toContain('lg:grid-cols-2');
    expect(l.last).toBe('');
  });

  it('centres a lone last card when the count is odd (3, 5)', () => {
    for (const n of [3, 5]) {
      const l = courseGridLayout(n);
      expect(l.grid).toContain('lg:grid-cols-2');
      expect(l.last).toContain('lg:mx-auto');
      expect(l.last).toContain('lg:col-span-2');
    }
  });

  it('has no special last card for even counts (4, 6)', () => {
    for (const n of [4, 6]) expect(courseGridLayout(n).last).toBe('');
  });

  it('handles zero courses without a column layout', () => {
    expect(courseGridLayout(0).grid).not.toContain('lg:grid-cols-2');
  });
});
