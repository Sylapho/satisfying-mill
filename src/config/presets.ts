import { z } from 'zod';

export const presetNames = ['tiktok', 'fast-preview', 'high-quality'] as const;
export const presetNameSchema = z.enum(presetNames);
export type PresetName = z.infer<typeof presetNameSchema>;

export const videoSettingsSchema = z.object({
  width: z.number().int().min(180).max(4320).multipleOf(2),
  height: z.number().int().min(320).max(7680).multipleOf(2),
  fps: z.number().int().min(12).max(120),
  crf: z.number().int().min(0).max(51),
  durationSeconds: z.number().min(1).max(60).nullable(),
}).strict();
export type VideoSettings = z.infer<typeof videoSettingsSchema>;

export const presets: Record<PresetName, VideoSettings> = {
  tiktok: { width: 1080, height: 1920, fps: 60, crf: 18, durationSeconds: null },
  'fast-preview': { width: 360, height: 640, fps: 30, crf: 26, durationSeconds: null },
  'high-quality': { width: 1080, height: 1920, fps: 60, crf: 14, durationSeconds: null },
};

export const getVideoSettings = (preset: PresetName, overrides: Partial<VideoSettings> = {}): VideoSettings =>
  videoSettingsSchema.parse({ ...presets[preset], ...overrides });
