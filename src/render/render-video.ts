import { renderMedia, selectComposition } from '@remotion/renderer';
import { access, mkdir, open, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { getVideoSettings, videoSettingsSchema } from '../config/presets';
import type { VideoSettings } from '../config/presets';
import { hashConfig, writeJson } from '../engine/files';
import { registry } from '../generators';
import { createCaption } from '../metadata/captions';
import { metadataSchema } from '../metadata/schema';
import type { VideoManifest } from '../metadata/schema';
import { durationFrames } from '../remotion/props';
import type { CompositionProps } from '../remotion/props';
import { renderThumbnail } from './render-thumbnail';
import { createRenderSession } from './session';
import type { RenderSession } from './session';
import { validateOutput } from './validate-output';
import { createAudioTrack } from '../audio/cache';
import { audioTimelineFor } from '../audio/timeline';

export type RenderOptions = {
  generator: string; seed: number; id?: string; output?: string; force?: boolean;
  settings?: VideoSettings; config?: unknown; concurrency?: number;
  captions?: boolean; hashtags?: string[]; audio?: boolean;
};
export const exists = async (file: string): Promise<boolean> => {
  try { await access(file); return true; } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false;
    throw error;
  }
};
export const renderVideo = async (options: RenderOptions, suppliedSession?: RenderSession): Promise<VideoManifest> => {
  const generator = registry.get(options.generator);
  const config = generator.validate(options.config ?? generator.generate(options.seed));
  if (config.seed !== options.seed) throw new Error('Configuration seed does not match requested seed.');
  const settings = videoSettingsSchema.parse(options.settings ?? getVideoSettings('tiktok'));
  const id = options.id ?? `${generator.id}-${options.seed}`;
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error('Output ID must contain only letters, numbers, underscores or hyphens.');
  const outputRoot = path.resolve(options.output ?? 'out');
  const video = path.join(outputRoot, 'videos', `${id}.mp4`);
  const thumbnail = path.join(outputRoot, 'thumbnails', `${id}.jpg`);
  const metadata = path.join(outputRoot, 'metadata', `${id}.json`);
  for (const file of [video, thumbnail, metadata]) {
    if (!options.force && await exists(file)) throw new Error(`Output already exists: ${file}. Use --force to overwrite.`);
    await mkdir(path.dirname(file), { recursive: true });
  }
  const lockPath = `${metadata}.lock`;
  const lock = await open(lockPath, 'wx').catch((error: unknown) => {
    throw new Error(`Video is already being rendered: ${id}. Lock: ${lockPath}`, { cause: error });
  });
  let session: RenderSession | undefined = suppliedSession;
  const temporaryVideo = `${video}.tmp.mp4`;
  const temporaryThumbnail = `${thumbnail}.tmp.jpg`;
  try {
    // Repeat after acquiring the lock to close the race between two processes.
    if (!options.force && await exists(video)) throw new Error(`Output already exists: ${video}. Use --force to overwrite.`);
    session ??= await createRenderSession();
    const props: CompositionProps = { config, settings, audioSrc: null, audioEnabled: options.audio ?? true };
    if (props.audioEnabled) props.audioSrc = (await createAudioTrack(audioTimelineFor(generator, props))).src;
    const composition = await selectComposition({ serveUrl: session.serveUrl, id: generator.id,
      inputProps: props, puppeteerInstance: session.browser, logLevel: 'warn' });
    console.log(`Rendering ${id}: ${composition.width}×${composition.height}, ${composition.fps} fps, ${composition.durationInFrames} frames`);
    let previous = -1;
    await renderMedia({ serveUrl: session.serveUrl, puppeteerInstance: session.browser, composition, inputProps: props,
      outputLocation: temporaryVideo, codec: 'h264', pixelFormat: 'yuv420p', colorSpace: 'bt709', crf: settings.crf,
      audioCodec: 'aac', audioBitrate: '192k',
      concurrency: options.concurrency ?? 2, logLevel: 'warn',
      onProgress: ({ progress }) => { const step = Math.floor(progress * 10); if (step > previous) { previous = step; console.log(`${id}: ${Math.round(progress * 100)}%`); } },
    });
    await renderThumbnail(session, composition, props, temporaryThumbnail);
    const info = generator.getMetadata(config);
    const frames = durationFrames(generator, props);
    const manifest = metadataSchema.parse({
      schemaVersion: 1, engineVersion: '0.1.0', codeHash: session.codeHash, generatorVersion: generator.version,
      id, generator: generator.id, seed: options.seed, createdAt: new Date().toISOString(),
      duration: frames / settings.fps, durationInFrames: frames,
      fps: settings.fps, width: settings.width, height: settings.height,
      config, configHash: hashConfig(config), settings,
      caption: createCaption(options.seed, info.category, options.captions ?? true),
      hashtags: options.hashtags ?? info.hashtags, loop: info.loop, audio: props.audioEnabled,
      video: `videos/${id}.mp4`, thumbnail: `thumbnails/${id}.jpg`,
    });
    const quality = await validateOutput(temporaryVideo, manifest);
    if (!quality.valid) throw new Error(`Output validation failed: ${quality.errors.join('; ')}`);
    await rename(temporaryVideo, video);
    await rename(temporaryThumbnail, thumbnail);
    await writeJson(metadata, manifest);
    console.log(`Validated ${video}`);
    return manifest;
  } finally {
    try {
      await rm(temporaryVideo, { force: true });
      await rm(temporaryThumbnail, { force: true });
      if (!suppliedSession && session) await session.close();
    } finally {
      await lock.close();
      await rm(lockPath, { force: true });
    }
  }
};
