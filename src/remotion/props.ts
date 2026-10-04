import { z } from 'zod';
import { presets, videoSettingsSchema } from '../config/presets';
import type { RegisteredGenerator } from '../types/generator';

export const compositionPropsSchema = z.object({
  config: z.unknown(),
  settings: videoSettingsSchema,
  audioSrc: z.string().nullable(),
  audioEnabled: z.boolean(),
  generatorId: z.string().optional(),
}).strict();
export type CompositionProps = z.infer<typeof compositionPropsSchema>;
export const defaultPropsFor = (generator: RegisteredGenerator): CompositionProps => ({
  config: generator.generate(42), settings: { ...presets.tiktok }, audioSrc: null, audioEnabled: true,
});
export const propsForInput = (generator: RegisteredGenerator, input: Record<string, unknown>): CompositionProps => {
  const defaults = defaultPropsFor(generator);
  return input.generatorId === generator.id ? compositionPropsSchema.parse({ ...defaults, ...input }) : defaults;
};
export const durationFrames = (generator: RegisteredGenerator, props: CompositionProps): number =>
  Math.max(1, Math.round((props.settings.durationSeconds ?? generator.getDuration(props.config)) * props.settings.fps));
