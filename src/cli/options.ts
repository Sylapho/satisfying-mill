import { parseArgs } from 'node:util';
import { z } from 'zod';
import { getVideoSettings, presetNameSchema } from '../config/presets';

const integer = (value: string | undefined, fallback: number, min: number, max: number): number => {
  if (value !== undefined && !/^\d+$/.test(value)) throw new Error(`Expected an integer, received "${value}".`);
  return z.number().int().min(min).max(max).parse(value === undefined ? fallback : Number(value));
};
export const parseCli = (args: string[]) => {
  const { values, positionals } = parseArgs({ args, allowPositionals: true, strict: true, options: {
    help: { type: 'boolean', short: 'h' }, seed: { type: 'string' }, count: { type: 'string' },
    fps: { type: 'string' }, duration: { type: 'string' }, preset: { type: 'string' },
    output: { type: 'string' }, force: { type: 'boolean' }, generator: { type: 'string' },
    variants: { type: 'string' }, concurrency: { type: 'string' }, config: { type: 'string' },
    weights: { type: 'string' }, 'similarity-threshold': { type: 'string' },
    'no-audio': { type: 'boolean' }, 'no-captions': { type: 'boolean' }, hashtags: { type: 'string' },
    'no-open': { type: 'boolean' }, port: { type: 'string' },
  } });
  if (positionals.length > 2) throw new Error('Too many arguments. Use factory --help.');
  const settingsOverrides = {
    ...(values.fps !== undefined ? { fps: integer(values.fps, 60, 12, 120) } : {}),
    ...(values.duration !== undefined ? { durationSeconds: z.number().min(1).max(60).parse(Number(values.duration)) } : {}),
  };
  const settings = getVideoSettings(presetNameSchema.parse(values.preset ?? 'tiktok'), settingsOverrides);
  const tags = values.hashtags?.split(',').map((tag) => tag.trim().replace(/^#/, '')).filter(Boolean);
  if (tags && tags.some((tag) => !/^[\p{L}\p{N}_]{1,50}$/u.test(tag))) throw new Error('Hashtags must contain letters, numbers or underscores.');
  return {
    command: positionals[0], target: positionals[1], help: values.help ?? false,
    seed: integer(values.seed, 42, 0, 0xffffffff), explicitSeed: values.seed !== undefined,
    count: integer(values.count, 10, 1, 10_000), variants: integer(values.variants, 1, 1, 1000),
    concurrency: integer(values.concurrency, 2, 1, 8),
    settings, settingsOverrides, explicitPreset: values.preset !== undefined,
    output: values.output, force: values.force ?? false, generator: values.generator ?? 'random',
    audio: !values['no-audio'], captions: !values['no-captions'], hashtags: tags,
    configFile: values.config, weightsFile: values.weights,
    similarityThreshold: z.number().min(0.5).max(1).parse(Number(values['similarity-threshold'] ?? 0.985)),
    noOpen: values['no-open'] ?? false, port: integer(values.port, 3000, 1024, 65535),
  };
};
export type CliOptions = ReturnType<typeof parseCli>;
export const helpText = `Satisfying Factory — procedural video engine

Usage: pnpm factory <command> [generator / folder] [options]

Commands:
  list                          List registered generators
  generate <generator>          Write validated configs to generated/configs
  render <generator>            Render MP4, thumbnail and metadata to out/
  batch                         Render a deterministic batch (10 videos by default)
  preview <generator>           Open Remotion Studio with this exact configuration
  validate [folder / file]      Validate MP4 files and their metadata (out/videos by default)

Options:
  --seed <0..4294967295>         Deterministic seed (default: 42)
  --count <n>                   Total videos in a batch (default: 10)
  --generator <id|random>       Batch generator (default: random)
  --variants <n>                Generate/render n variants; batch keeps each generator for n videos
  --preset <name>               tiktok | fast-preview | high-quality
  --fps <12..120>               Override preset frame rate
  --duration <1..60>            Retiming of the whole animation, in seconds
  --output <folder>             Output root (default: out; generated for generate)
  --config <json>               Raw generator config or a recipe from generate
  --concurrency <1..8>          Chromium frame workers per video (default: 2)
  --weights <json>              Generator weights for random batches
  --similarity-threshold <n>    Reject similarity >= n (default: 0.985)
  --no-audio                    Disable audio synthesis
  --no-captions                 Write an empty caption in metadata
  --hashtags <a,b,c>            Override hashtags; empty string disables them
  --force                       Explicitly allow overwriting existing outputs
  --port <n>                    Studio port (default: 3000)
  --no-open                     Run Studio without opening the browser
  --help, -h                    Show this help

Examples:
  pnpm factory render ball-drop --seed 42
  pnpm factory render perfect-loop --seed 4882 --preset high-quality
  pnpm factory batch --generator random --count 100 --seed 123
  pnpm factory preview grid-fill --seed 42
  pnpm factory validate out/videos
`;
