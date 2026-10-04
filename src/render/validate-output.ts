import { getVideoMetadata } from '@remotion/renderer';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { registry } from '../generators';
import { readJson, hashConfig } from '../engine/files';
import { metadataSchema } from '../metadata/schema';
import type { VideoManifest } from '../metadata/schema';

export type QualityResult = { valid: boolean; errors: string[] };
export type QualityCheck = (video: string, manifest: VideoManifest) => Promise<string[]>;
export const validateOutput = async (video: string, manifest: VideoManifest, extraChecks: readonly QualityCheck[] = []): Promise<QualityResult> => {
  const errors: string[] = [];
  const parsed = metadataSchema.safeParse(manifest);
  if (!parsed.success) return { valid: false, errors: [parsed.error.message] };
  try {
    registry.get(manifest.generator).validate(manifest.config);
    if (hashConfig(manifest.config) !== manifest.configHash) errors.push('Configuration hash mismatch.');
    if (manifest.seed !== manifest.config.seed) errors.push('Manifest seed differs from configuration.');
    if (Math.abs(manifest.duration - manifest.durationInFrames / manifest.fps) > 1e-6) errors.push('Manifest duration and frame count disagree.');
    if (manifest.width !== manifest.settings.width || manifest.height !== manifest.settings.height || manifest.fps !== manifest.settings.fps) errors.push('Manifest settings disagree with dimensions or fps.');
    if ((await stat(video)).size === 0) errors.push('Video file is empty.');
    else {
      const actual = await getVideoMetadata(path.resolve(video), { logLevel: 'error' });
      if (actual.width !== manifest.width || actual.height !== manifest.height) errors.push(`Unexpected resolution: ${actual.width}×${actual.height}.`);
      if (Math.abs(actual.fps - manifest.fps) > 0.05) errors.push(`Unexpected fps: ${actual.fps}.`);
      if (actual.durationInSeconds === null || Math.abs(actual.durationInSeconds - manifest.duration) > Math.max(0.1, 2 / manifest.fps)) errors.push(`Unexpected duration: ${actual.durationInSeconds}s.`);
      if (actual.codec !== 'h264' || actual.pixelFormat?.toLowerCase() !== 'yuv420p') errors.push(`Expected H.264 video with yuv420p pixels; received ${actual.codec}/${actual.pixelFormat}.`);
      if (manifest.audio && actual.audioCodec !== 'aac') errors.push('Expected an AAC audio track.');
    }
    for (const check of extraChecks) errors.push(...await check(video, manifest));
  } catch (error) { errors.push(error instanceof Error ? error.message : String(error)); }
  return { valid: errors.length === 0, errors };
};

export const validateVideoFile = async (video: string): Promise<QualityResult> => {
  try {
    const root = path.dirname(path.dirname(path.resolve(video)));
    const manifest = metadataSchema.parse(await readJson(path.join(root, 'metadata', `${path.basename(video, '.mp4')}.json`)));
    if (path.resolve(root, manifest.video) !== path.resolve(video)) return { valid: false, errors: ['Manifest video path does not match this file.'] };
    if (manifest.thumbnail !== `thumbnails/${manifest.id}.jpg`) return { valid: false, errors: ['Unexpected thumbnail path.'] };
    if ((await stat(path.resolve(root, manifest.thumbnail))).size === 0) return { valid: false, errors: ['Thumbnail is empty.'] };
    return await validateOutput(video, manifest);
  } catch (error) { return { valid: false, errors: [error instanceof Error ? error.message : String(error)] }; }
};
