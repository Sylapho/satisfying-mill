import { z } from 'zod';

export const analyticsSnapshotSchema = z.object({
  source: z.enum(['manual', 'authorized-api']),
  observedAt: z.string().datetime(),
  publishedAt: z.string().datetime().optional(),
  views: z.number().int().nonnegative().optional(),
  likes: z.number().int().nonnegative().optional(),
  comments: z.number().int().nonnegative().optional(),
  shares: z.number().int().nonnegative().optional(),
  averageWatchTime: z.number().nonnegative().optional(),
  completionRate: z.number().min(0).max(1).optional(),
}).strict();
export type AnalyticsSnapshot = z.infer<typeof analyticsSnapshotSchema>;
