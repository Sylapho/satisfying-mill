import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { getVideoMetadata } from '@remotion/renderer';
import { validateOutput, validateVideoFile } from '../src/render/validate-output';
import { writeJson } from '../src/engine/files';
import { makeManifest } from './helpers/manifest';

vi.mock('@remotion/renderer', () => ({ getVideoMetadata: vi.fn() }));
let directory: string; let video: string;
beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'factory-quality-'));
  await mkdir(path.join(directory, 'videos')); video = path.join(directory, 'videos', '000001.mp4');
  await writeFile(video, 'mock media bytes');
  vi.mocked(getVideoMetadata).mockResolvedValue({ fps: 60, width: 1080, height: 1920, durationInSeconds: 6,
    codec: 'h264', canPlayInVideoTag: true, supportsSeeking: true, colorSpace: 'bt709', audioCodec: 'aac', audioFileExtension: 'aac', pixelFormat: 'yuv420p' });
});
afterEach(async () => { await rm(directory, { recursive: true, force: true }); vi.clearAllMocks(); });
it('accepts a valid manifest and media properties', async () => {
  expect(await validateOutput(video, makeManifest())).toEqual({ valid: true, errors: [] });
});
it('rejects empty or missing videos, mismatched dimensions and absent audio', async () => {
  await writeFile(video, ''); expect((await validateOutput(video, makeManifest())).valid).toBe(false);
  await writeFile(video, 'mock media bytes');
  const metadata = await getVideoMetadata(video);
  vi.mocked(getVideoMetadata).mockResolvedValue({ ...metadata, width: 720, audioCodec: null });
  const result = await validateOutput(video, makeManifest());
  expect(result.errors.some((message) => message.includes('resolution'))).toBe(true);
  expect(result.errors.some((message) => message.includes('AAC'))).toBe(true);
  expect((await validateOutput(path.join(directory, 'missing.mp4'), makeManifest())).valid).toBe(false);
});
it('rejects tampered configs, inconsistent durations and invalid generator parameters', async () => {
  const manifest = makeManifest();
  expect((await validateOutput(video, { ...manifest, configHash: 'b'.repeat(64) })).valid).toBe(false);
  expect((await validateOutput(video, { ...manifest, durationInFrames: 10 })).valid).toBe(false);
  expect((await validateOutput(video, { ...manifest, config: { ...manifest.config, columns: 20 } })).valid).toBe(false);
});
it('requires metadata and a thumbnail, and allows extra quality checks', async () => {
  expect((await validateVideoFile(video)).valid).toBe(false);
  await writeJson(path.join(directory, 'metadata/000001.json'), makeManifest());
  expect((await validateVideoFile(video)).valid).toBe(false);
  await mkdir(path.join(directory, 'thumbnails')); await writeFile(path.join(directory, 'thumbnails/000001.jpg'), 'image bytes');
  expect((await validateVideoFile(video)).valid).toBe(true);
  expect((await validateOutput(video, makeManifest(), [async () => ['Black frame detected.']])).valid).toBe(false);
});
