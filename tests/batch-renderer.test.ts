import { mkdtemp, readdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { renderBatch } from '../src/render/render-batch';
import { renderVideo } from '../src/render/render-video';
import { createRenderSession } from '../src/render/session';
import { batchManifestSchema } from '../src/metadata/schema';
import { makeManifest } from './helpers/manifest';

vi.mock('../src/render/render-video', () => ({ renderVideo: vi.fn() }));
vi.mock('../src/render/session', () => ({ createRenderSession: vi.fn() }));
let directory: string;
const close = vi.fn(async () => {});
beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'factory-batch-'));
  // The renderer is mocked; these tests isolate orchestration and failure persistence.
  vi.mocked(createRenderSession).mockResolvedValue({ serveUrl: 'mock-bundle', browser: {} as Awaited<ReturnType<typeof createRenderSession>>['browser'], codeHash: 'a'.repeat(64), close });
  vi.mocked(renderVideo).mockImplementation(async (options) => makeManifest(options.id, options.generator, options.seed));
});
afterEach(async () => { await rm(directory, { recursive: true, force: true }); vi.resetAllMocks(); });
it('reuses one bundle and persists a valid completed manifest', async () => {
  const manifest = await renderBatch({ count: 3, output: directory });
  expect(manifest.status).toBe('completed'); expect(manifest.videos).toHaveLength(3);
  expect(createRenderSession).toHaveBeenCalledTimes(1); expect(close).toHaveBeenCalledTimes(1);
  const files = await readdir(path.join(directory, 'manifests'));
  expect(files).toHaveLength(1);
  expect(batchManifestSchema.parse(JSON.parse(await readFile(path.join(directory, 'manifests', files[0]!), 'utf8')))).toEqual(manifest);
  expect(await readdir(directory)).not.toContain('.factory-batch.lock');
});
it('records a failure and continues rendering subsequent videos', async () => {
  vi.mocked(renderVideo).mockRejectedValueOnce(new Error('Simulated render failure.'));
  const manifest = await renderBatch({ count: 3, output: directory });
  expect(manifest.status).toBe('partial'); expect(manifest.videos).toHaveLength(2); expect(manifest.failures).toHaveLength(1);
  expect(renderVideo).toHaveBeenCalledTimes(3);
});
it('marks bundle initialization failure and releases the lock', async () => {
  vi.mocked(createRenderSession).mockRejectedValueOnce(new Error('Chromium unavailable.'));
  const manifest = await renderBatch({ count: 1, output: directory });
  expect(manifest.status).toBe('failed'); expect(manifest.completedAt).not.toBeNull();
  expect(manifest.failures[0]!.error).toContain('Chromium unavailable');
  expect(await readdir(directory)).not.toContain('.factory-batch.lock');
});
it('refuses an output root locked by another batch', async () => {
  await writeFile(path.join(directory, '.factory-batch.lock'), '{}');
  await expect(renderBatch({ count: 1, output: directory })).rejects.toThrow('locked');
  expect(renderVideo).not.toHaveBeenCalled();
});
