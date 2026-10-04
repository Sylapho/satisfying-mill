import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { readJson, writeJson } from '../engine/files';
import { createRandom } from '../engine/random';
import { registry } from '../generators';
import { recipeSchema } from '../metadata/recipe';
import { videoSettingsSchema } from '../config/presets';
import { createRenderSession } from '../render/session';
import { exists, renderVideo } from '../render/render-video';
import { renderBatch } from '../render/render-batch';
import { validateVideoFile } from '../render/validate-output';
import { parseCli, helpText } from './options';
import type { CliOptions } from './options';
import { preview } from './preview';

const loadConfig = async (options: CliOptions, id: string) => {
  const generator = registry.get(id);
  if (!options.configFile) return { config: generator.generate(options.seed), settings: options.settings };
  const data = await readJson(path.resolve(options.configFile));
  const recipe = recipeSchema.safeParse(data);
  if (recipe.success) {
    if (recipe.data.generator !== id) throw new Error(`Recipe is for ${recipe.data.generator}, not ${id}.`);
    if (recipe.data.generatorVersion !== generator.version) throw new Error('Recipe generator version differs from the installed generator.');
    if (recipe.data.seed !== recipe.data.config.seed) throw new Error('Recipe seed differs from its configuration.');
  }
  const config = generator.validate(recipe.success ? recipe.data.config : data);
  if (options.explicitSeed && config.seed !== options.seed) throw new Error('The supplied --seed differs from the configuration seed.');
  return { config, settings: recipe.success && !options.explicitPreset
    ? videoSettingsSchema.parse({ ...recipe.data.settings, ...options.settingsOverrides }) : options.settings };
};
const variantSeeds = (seed: number, count: number): number[] => {
  const result = [seed]; const random = createRandom(seed).fork('variants');
  while (result.length < count) { const next = random.int(0, 0xffffffff); if (!result.includes(next)) result.push(next); }
  return result;
};
const validateCommand = async (target: string): Promise<void> => {
  const resolved = path.resolve(target);
  const details = await stat(resolved);
  const files = details.isDirectory()
    ? (await readdir(resolved)).filter((name) => name.endsWith('.mp4') && !name.endsWith('.tmp.mp4')).sort().map((name) => path.join(resolved, name))
    : [resolved];
  if (files.length === 0) throw new Error(`No MP4 files found: ${resolved}`);
  let failures = 0;
  for (const file of files) {
    const result = await validateVideoFile(file);
    if (!result.valid) failures++;
    console.log(`${result.valid ? 'PASS' : 'FAIL'} ${path.basename(file)}${result.valid ? '' : `: ${result.errors.join('; ')}`}`);
  }
  console.log(`${files.length - failures}/${files.length} valid videos.`);
  if (failures) process.exitCode = 1;
};

export const main = async (args: string[]): Promise<void> => {
  const options = parseCli(args);
  if (options.help || !options.command) { console.log(helpText); return; }
  if (options.command === 'list') {
    for (const generator of registry.list()) console.log(`${generator.id.padEnd(16)} ${generator.name} v${generator.version}`);
    return;
  }
  if (options.command === 'validate') { await validateCommand(options.target ?? 'out/videos'); return; }
  const shared = {
    settings: options.settings, output: options.output ?? 'out', force: options.force,
    concurrency: options.concurrency, captions: options.captions, audio: options.audio,
    ...(options.hashtags !== undefined ? { hashtags: options.hashtags } : {}),
  };
  if (options.command === 'batch') {
    if (options.target || options.configFile) throw new Error('Use batch --generator <id>; --config is for generate/render/preview.');
    const weights = options.weightsFile ? z.record(z.string(), z.number().finite().nonnegative()).parse(await readJson(options.weightsFile)) : undefined;
    const result = await renderBatch({ ...shared, generator: options.generator, count: options.count, seed: options.seed,
      variants: options.variants, similarityThreshold: options.similarityThreshold, ...(weights ? { weights } : {}),
    });
    if (result.failures.length > 0) process.exitCode = 1;
    return;
  }
  if (!['generate', 'render', 'preview'].includes(options.command)) throw new Error(`Unknown command "${options.command}". Use --help.`);
  if (!options.target) throw new Error(`${options.command} requires a generator ID. Use factory list.`);
  if (options.configFile && options.variants !== 1) throw new Error('--config and --variants cannot be combined.');
  const generator = registry.get(options.target);
  const loaded = await loadConfig(options, generator.id);
  const initial = loaded.config;
  shared.settings = loaded.settings;
  const seeds = variantSeeds(initial.seed, options.variants);
  if (options.command === 'preview') {
    if (options.variants !== 1) throw new Error('Preview shows one variant at a time.');
    await preview(generator.id, { config: initial, settings: loaded.settings, audioSrc: null, audioEnabled: options.audio }, options.port, options.noOpen);
    return;
  }
  if (options.command === 'generate') {
    for (const seed of seeds) {
      const config = options.configFile ? initial : generator.generate(seed);
      const filename = path.resolve(options.output ?? 'generated', 'configs', `${generator.id}-${seed}.json`);
      if (!options.force && await exists(filename)) throw new Error(`Recipe already exists: ${filename}. Use --force.`);
      const recipe = recipeSchema.parse({ schemaVersion: 1, generator: generator.id, generatorVersion: generator.version, seed, config, settings: loaded.settings });
      await writeJson(filename, recipe);
      console.log(`${filename}\n${JSON.stringify(config, null, 2)}`);
    }
    return;
  }
  if (seeds.length === 1) {
    await renderVideo({ ...shared, generator: generator.id, seed: initial.seed, config: initial });
    return;
  }
  const session = await createRenderSession();
  try {
    for (const seed of seeds) await renderVideo({ ...shared, generator: generator.id, seed, config: options.configFile ? initial : generator.generate(seed) }, session);
  } finally { await session.close(); }
};

try { process.loadEnvFile(); } catch (error) {
  if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
}

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(`Factory error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
