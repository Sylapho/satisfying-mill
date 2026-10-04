import { mkdtemp, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { beforeAll, afterAll, expect, it } from 'vitest';
import { registry } from '../../src/generators';
import { getVideoSettings } from '../../src/config/presets';
import { renderVideo } from '../../src/render/render-video';
import { createRenderSession } from '../../src/render/session';
import type { RenderSession } from '../../src/render/session';
import { validateVideoFile } from '../../src/render/validate-output';

let directory: string; let session: RenderSession;
beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'factory-integration-'));
  session = await createRenderSession();
}, 120_000);
afterAll(async () => {
  if (session) await session.close();
  if (directory) await rm(directory, { recursive: true, force: true });
}, 30_000);

it('renders three real MP4 files from one bundle, with audio and valid metadata', async () => {
  for (const generator of registry.list()) {
    const result = await renderVideo({ generator: generator.id, seed: 42, output: directory,
      settings: getVideoSettings('fast-preview', { durationSeconds: 1 }), concurrency: 1,
    }, session);
    const file = path.join(directory, result.video);
    expect((await stat(file)).size).toBeGreaterThan(0);
    expect(await validateVideoFile(file)).toEqual({ valid: true, errors: [] });
    await expect(renderVideo({ generator: generator.id, seed: 42, output: directory }, session)).rejects.toThrow('already exists');
  }
}, 120_000);
