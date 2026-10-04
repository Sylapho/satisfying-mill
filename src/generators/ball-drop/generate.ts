import { createRandom } from '../../engine/random';
import { generateBackground, generatePalette } from '../../engine/palette';
import type { BallDropConfig } from './schema';

export const generateBallDrop = (seed: number): BallDropConfig => {
  const random = createRandom(seed);
  const columns = random.int(3, 5);
  const rows = random.int(3, 5);
  const intervalSeconds = random.float(0.16, 0.23);
  const dropSeconds = random.float(0.5, 0.75);
  return {
    seed, columns, rows, intervalSeconds, dropSeconds,
    durationSeconds: Math.max(6, Math.ceil((0.45 + (columns * rows - 1) * intervalSeconds + dropSeconds + 1.15) * 60) / 60),
    radius: random.float(0.045, 0.062),
    spacing: random.float(0.158, 0.183),
    anticipation: random.float(0.035, 0.09),
    layout: random.pick(['grid', 'staggered'] as const),
    order: random.boolean(0.6)
      ? Array.from({ length: columns * rows }, (_, i) => i)
      : random.shuffle(Array.from({ length: columns * rows }, (_, i) => i)),
    palette: generatePalette(random.fork('palette')),
    background: generateBackground(random.fork('background')),
  };
};
