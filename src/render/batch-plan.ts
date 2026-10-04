import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { createRandom } from '../engine/random';
import { registry } from '../generators';
import { configurationSimilarity } from '../quality/configuration';
import type { BaseConfig } from '../types/generator';

export const batchOptionsSchema = z.object({
  count: z.number().int().min(1).max(10_000).default(10),
  seed: z.number().int().min(0).max(0xffffffff).default(42),
  generator: z.string().default('random'),
  variants: z.number().int().min(1).max(1000).default(1),
  weights: z.record(z.string(), z.number().nonnegative()).optional(),
  similarityThreshold: z.number().min(0.5).max(1).default(0.985),
});
export type BatchPlanOptions = z.input<typeof batchOptionsSchema>;
export type PlannedVideo = { id: string; generator: string; seed: number; config: BaseConfig };

export const nextVideoNumber = async (output: string): Promise<number> => {
  let maximum = 0;
  for (const folder of ['videos', 'metadata', 'thumbnails']) {
    let files: string[];
    try { files = await readdir(path.resolve(output, folder)); } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') continue;
      throw error;
    }
    for (const file of files) {
      const match = /^(\d+)\.(?:mp4|json|jpg)/.exec(file);
      if (match) maximum = Math.max(maximum, Number(match[1]));
    }
  }
  return maximum + 1;
};

export const createBatchPlan = (input: BatchPlanOptions, firstNumber = 1): PlannedVideo[] => {
  const options = batchOptionsSchema.parse(input);
  if (!Number.isSafeInteger(firstNumber) || firstNumber < 1) throw new Error('First output number must be positive.');
  if (options.generator !== 'random') registry.get(options.generator);
  const random = createRandom(options.seed).fork('batch-seeds');
  const seeds = new Set<number>();
  const plan: PlannedVideo[] = [];
  for (let i = 0; i < options.count; i++) {
    const generator = options.generator === 'random'
      ? registry.choose(createRandom(options.seed).fork(`group-${Math.floor(i / options.variants)}`).int(0, 0xffffffff), options.weights)
      : registry.get(options.generator);
    let item: PlannedVideo | undefined;
    for (let attempt = 0; attempt < 300; attempt++) {
      const seed = random.int(0, 0xffffffff);
      if (seeds.has(seed)) continue;
      const config = generator.generate(seed);
      if (plan.some((previous) => previous.generator === generator.id && configurationSimilarity(previous.config, config) >= options.similarityThreshold)) continue;
      item = { id: String(firstNumber + i).padStart(6, '0'), generator: generator.id, seed, config };
      seeds.add(seed); break;
    }
    if (!item) throw new Error(`Could not find a sufficiently distinct ${generator.id} configuration after 300 attempts. Lower --similarity-threshold.`);
    plan.push(item);
  }
  return plan;
};
