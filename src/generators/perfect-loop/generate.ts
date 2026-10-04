import { createRandom } from '../../engine/random';
import { generateBackground, generatePalette } from '../../engine/palette';
import type { PerfectLoopConfig } from './schema';

export const generatePerfectLoop = (seed: number): PerfectLoopConfig => {
  const random = createRandom(seed);
  return {
    seed, durationSeconds: random.int(6, 10), count: random.int(10, 20),
    orbitRadius: random.float(0.25, 0.33), objectRadius: random.float(0.017, 0.027),
    cycles: random.int(1, 2), harmonic: random.int(2, 4), phase: random.float(0, 2 * Math.PI),
    mode: random.pick(['orbit', 'wave', 'rosette'] as const), trails: random.int(4, 8), clockwise: random.boolean(),
    palette: generatePalette(random.fork('palette')), background: generateBackground(random.fork('background')),
  };
};
