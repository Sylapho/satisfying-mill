import { z } from 'zod';
import { videoSettingsSchema } from '../config/presets';

export const recipeSchema = z.object({
  schemaVersion: z.literal(1), generator: z.string(), generatorVersion: z.string(),
  seed: z.number().int().min(0).max(0xffffffff), config: z.record(z.string(), z.unknown()), settings: videoSettingsSchema,
}).strict();
