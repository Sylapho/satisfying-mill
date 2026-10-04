import { z } from 'zod';
import { baseConfigSchema } from '../../types/config';

export const perfectLoopSchema = baseConfigSchema.extend({
  count: z.number().int().min(8).max(24),
  orbitRadius: z.number().min(0.23).max(0.34),
  objectRadius: z.number().min(0.014).max(0.029),
  cycles: z.number().int().min(1).max(3),
  harmonic: z.number().int().min(2).max(4),
  phase: z.number().min(0).max(2 * Math.PI),
  mode: z.enum(['orbit', 'wave', 'rosette']),
  trails: z.number().int().min(3).max(10),
  clockwise: z.boolean(),
}).strict();
export type PerfectLoopConfig = z.infer<typeof perfectLoopSchema>;
