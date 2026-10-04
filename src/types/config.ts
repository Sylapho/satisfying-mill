import { z } from 'zod';

export const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const baseConfigSchema = z.object({
  seed: z.number().int().min(0).max(0xffffffff),
  durationSeconds: z.number().min(6).max(12),
  background: colorSchema,
  palette: z.array(colorSchema).min(2).max(12),
});
export const isPermutation = (order: readonly number[], count: number): boolean =>
  order.length === count && new Set(order).size === count && order.every((i) => Number.isInteger(i) && i >= 0 && i < count);
