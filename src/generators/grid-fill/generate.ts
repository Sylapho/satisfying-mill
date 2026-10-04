import { createRandom } from '../../engine/random';
import { generateBackground, generatePalette } from '../../engine/palette';
import { createGridOrder, gridOrders } from './order';
import type { GridFillConfig } from './schema';

export const generateGridFill = (seed: number): GridFillConfig => {
  const random = createRandom(seed);
  const columns = random.int(4, 9); const rows = random.int(5, 10);
  const intervalSeconds = random.float(0.045, 0.09);
  const animationSeconds = random.float(0.35, 0.6);
  const strategy = random.pick(gridOrders);
  return {
    seed, columns, rows, intervalSeconds, animationSeconds, strategy,
    durationSeconds: Math.max(6, Math.ceil((0.5 + (columns * rows - 1) * intervalSeconds + animationSeconds + 1) * 60) / 60),
    shape: random.pick(['circle', 'rounded-square', 'diamond'] as const),
    animation: random.pick(['spring', 'turn', 'rise'] as const),
    cornerRadius: random.float(0.12, 0.38), gap: random.float(0.16, 0.28),
    order: createGridOrder(columns, rows, strategy, random.fork('order')),
    palette: generatePalette(random.fork('palette')), background: generateBackground(random.fork('background')),
  };
};
