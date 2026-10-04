import { z } from 'zod';
import { baseConfigSchema, isPermutation } from '../../types/config';
import { gridOrders } from './order';

export const gridFillSchema = baseConfigSchema.extend({
  columns: z.number().int().min(4).max(9),
  rows: z.number().int().min(5).max(11),
  shape: z.enum(['circle', 'rounded-square', 'diamond']),
  cornerRadius: z.number().min(0.08).max(0.5),
  gap: z.number().min(0.1).max(0.3),
  intervalSeconds: z.number().min(0.04).max(0.11),
  animationSeconds: z.number().min(0.3).max(0.65),
  animation: z.enum(['spring', 'turn', 'rise']),
  strategy: z.enum(gridOrders),
  order: z.array(z.number().int().nonnegative()),
}).strict().superRefine((config, ctx) => {
  if (!isPermutation(config.order, config.rows * config.columns)) ctx.addIssue({ code: 'custom', message: 'Order must be a permutation of all cells.' });
  if (0.5 + (config.columns * config.rows - 1) * config.intervalSeconds + config.animationSeconds + 0.6 > config.durationSeconds) {
    ctx.addIssue({ code: 'custom', message: 'Duration must allow the grid to finish filling.' });
  }
});
export type GridFillConfig = z.infer<typeof gridFillSchema>;
