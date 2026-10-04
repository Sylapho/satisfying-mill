import { z } from 'zod';

export const soundNames = ['click', 'pop', 'impact', 'tick', 'tone', 'whoosh'] as const;
export const audioEventSchema = z.object({
  frame: z.number().int().nonnegative(), sound: z.enum(soundNames),
  pitch: z.number().min(0.125).max(8), gain: z.number().min(0).max(2),
}).strict();
export const audioOptionsSchema = z.object({
  events: z.array(audioEventSchema).max(2000), fps: z.number().int().min(12).max(120),
  durationInFrames: z.number().int().positive(), seed: z.number().int().min(0).max(0xffffffff),
  sampleRate: z.number().int().min(8000).max(96000).default(48000), loop: z.boolean().default(false),
}).strict().superRefine((options, ctx) => {
  if (options.durationInFrames / options.fps > 60) ctx.addIssue({ code: 'custom', message: 'Audio timeline cannot exceed 60 seconds.' });
  if (options.events.some((event) => event.frame >= options.durationInFrames)) ctx.addIssue({ code: 'custom', message: 'Audio event starts after the video ends.' });
});
export type AudioOptions = z.input<typeof audioOptionsSchema>;
