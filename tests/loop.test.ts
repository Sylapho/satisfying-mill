import { expect, it } from 'vitest';
import { loopProgress, loopSine, loopCosine, TAU } from '../src/engine/loop';
import { generatePerfectLoop } from '../src/generators/perfect-loop/generate';
import { loopPosition } from '../src/generators/perfect-loop/position';

it('wraps frame progress, including negative frames', () => {
  expect(loopProgress(0, 360)).toBe(0); expect(loopProgress(360, 360)).toBe(0);
  expect(loopProgress(90, 360)).toBe(0.25); expect(loopProgress(-1, 360)).toBeCloseTo(359 / 360);
  expect(() => loopProgress(0, 0)).toThrow();
});
it('has periodic trigonometry for integer harmonics', () => {
  for (let cycles = 1; cycles <= 5; cycles++) {
    expect(loopSine(0, cycles, 0.3)).toBeCloseTo(loopSine(1, cycles, 0.3), 12);
    expect(loopCosine(0, cycles, TAU / 3)).toBeCloseTo(loopCosine(1, cycles, TAU / 3), 12);
  }
});
it('has matching positions, scale and boundary velocity for every mode', () => {
  const epsilon = 1e-5;
  for (const mode of ['orbit', 'wave', 'rosette'] as const) {
    const config = { ...generatePerfectLoop(42), mode };
    for (let i = 0; i < config.count; i++) {
      const a = loopPosition(config, i, 0); const b = loopPosition(config, i, 1);
      expect(a.x).toBeCloseTo(b.x, 9); expect(a.y).toBeCloseTo(b.y, 9); expect(a.scale).toBeCloseTo(b.scale, 9);
      const before = loopPosition(config, i, -epsilon); const after = loopPosition(config, i, epsilon);
      const endBefore = loopPosition(config, i, 1 - epsilon); const endAfter = loopPosition(config, i, 1 + epsilon);
      expect(after.x - before.x).toBeCloseTo(endAfter.x - endBefore.x, 8);
      expect(after.y - before.y).toBeCloseTo(endAfter.y - endBefore.y, 8);
    }
  }
});
