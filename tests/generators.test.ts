import { expect, it } from 'vitest';
import { registry } from '../src/generators';
import { createRegistry } from '../src/engine/registry';

it('validates generated configs across many seeds', () => {
  for (const generator of registry.list()) for (let seed = 0; seed < 100; seed++) {
    const config = generator.generate(seed);
    expect(generator.validate(config)).toEqual(config);
    expect(generator.generate(seed)).toEqual(config);
    expect(generator.getDuration(config)).toBeGreaterThanOrEqual(6);
    expect(generator.getDuration(config)).toBeLessThanOrEqual(12);
    expect(generator.generate(seed + 1)).not.toEqual(config);
  }
});
it('registry chooses deterministically, supports weights and rejects duplicates', () => {
  expect(registry.choose(42).id).toBe(registry.choose(42).id);
  expect(registry.choose(2, { 'ball-drop': 1 }).id).toBe('ball-drop');
  expect(() => registry.get('missing')).toThrow('Unknown generator');
  const copy = createRegistry(registry.list());
  expect(() => copy.register(registry.get('ball-drop'))).toThrow('already registered');
});
