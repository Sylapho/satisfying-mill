import { z } from 'zod';
import { baseConfigSchema, isPermutation } from '../../types/config';
export const ballDropSchema = baseConfigSchema.extend({
  layout: z.enum(['grid', 'staggered']),
  columns: z.number().int().min(3).max(5),
  rows: z.number().int().min(3).max(5),
  radius: z.number().min(0.04).max(0.07),
  spacing: z.number().min(0.15).max(0.20),
  dropSeconds: z.number().min(0.45).max(0.8),
  intervalSeconds: z.number().min(0.14).max(0.24),
  anticipation: z.number().min(0).max(0.12),
  order: z.array(z.number().int().nonnegative()),
}).strict().superRefine((config, ctx) => {
  const count = config.columns * config.rows;
  if (!isPermutation(config.order, count)) {
    ctx.addIssue({ code: 'custom', message: 'Order must be a permutation of all ball indices.' });
  }
  if (0.45 + (count - 1) * config.intervalSeconds + config.dropSeconds + 0.6 > config.durationSeconds) {
    ctx.addIssue({ code: 'custom', message: 'Duration does not leave enough time for every ball to settle.' });
  }
});
export type BallDropConfig = z.infer<typeof ballDropSchema>;
