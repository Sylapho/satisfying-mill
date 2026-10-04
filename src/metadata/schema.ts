import { z } from 'zod';
import { videoSettingsSchema } from '../config/presets';
import { analyticsSnapshotSchema } from '../analytics/schema';

export const metadataSchema = z.object({
  schemaVersion: z.literal(1),
  engineVersion: z.string().min(1),
  codeHash: z.string().regex(/^[a-f0-9]{64}$/),
  generatorVersion: z.string().min(1),
  id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
  generator: z.string().min(1),
  seed: z.number().int().min(0).max(0xffffffff),
  createdAt: z.string().datetime(),
  duration: z.number().min(1).max(60),
  durationInFrames: z.number().int().positive(),
  fps: z.number().int().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  config: z.record(z.string(), z.unknown()),
  configHash: z.string().regex(/^[a-f0-9]{64}$/),
  settings: videoSettingsSchema,
  caption: z.string(),
  hashtags: z.array(z.string()),
  loop: z.boolean(),
  audio: z.boolean(),
  video: z.string().min(1),
  thumbnail: z.string().min(1),
  analytics: analyticsSnapshotSchema.optional(),
}).strict();
export type VideoManifest = z.infer<typeof metadataSchema>;

export const batchManifestSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string(),
  seed: z.number().int().min(0).max(0xffffffff),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  status: z.enum(['running', 'completed', 'partial', 'failed']),
  requested: z.number().int().positive(),
  videos: z.array(metadataSchema),
  failures: z.array(z.object({ id: z.string(), generator: z.string(), seed: z.number(), error: z.string() })),
}).strict();
export type BatchManifest = z.infer<typeof batchManifestSchema>;
