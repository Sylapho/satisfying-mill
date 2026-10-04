import { describe, expect, it } from 'vitest';
import { createRandom } from '../src/engine/random';

describe('deterministic PRNG', () => {
  const draws = (seed: number) => { const random = createRandom(seed); return Array.from({ length: 30 }, () => random.float()); };
  it('repeats the same sequence and changes with the seed', () => {
    expect(draws(42)).toEqual(draws(42)); expect(draws(42)).not.toEqual(draws(43));
  });
  it('has stable pick, shuffle and weighted selection', () => {
    const a = createRandom(1); const b = createRandom(1);
    expect(a.pick(['a', 'b', 'c'])).toEqual(b.pick(['a', 'b', 'c']));
    const shuffled = a.shuffle([1, 2, 3, 4, 5]);
    expect(shuffled).toEqual(b.shuffle([1, 2, 3, 4, 5]));
    expect([...shuffled].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(a.weighted([{ value: 'x', weight: 0 }, { value: 'y', weight: 5 }])).toBe('y');
  });
  it('forks are independent of parent draw order', () => {
    const a = createRandom(42); const b = createRandom(42); a.float(); a.float();
    expect(a.fork('colors').float()).toBe(b.fork('colors').float());
    expect(a.fork('colors').float()).not.toBe(a.fork('timing').float());
  });
  it('rejects invalid inputs', () => {
    expect(() => createRandom(-1)).toThrow(); expect(() => createRandom(1.1)).toThrow();
    const random = createRandom(0);
    expect(() => random.pick([])).toThrow(); expect(() => random.boolean(2)).toThrow();
    expect(() => random.weighted([{ value: 1, weight: 0 }])).toThrow();
    expect(() => random.float(2, 1)).toThrow();
  });
  it('stays within inclusive integer and exclusive float bounds', () => {
    const random = createRandom(123);
    for (let i = 0; i < 1000; i++) {
      const n = random.int(-4, 9); expect(n).toBeGreaterThanOrEqual(-4); expect(n).toBeLessThanOrEqual(9);
      const f = random.float(3, 8); expect(f).toBeGreaterThanOrEqual(3); expect(f).toBeLessThan(8);
    }
  });
});
