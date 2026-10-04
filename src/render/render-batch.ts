import { mkdir, open, rm } from 'node:fs/promises';
import path from 'node:path';
import { writeJson } from '../engine/files';
import { batchManifestSchema } from '../metadata/schema';
import type { BatchManifest } from '../metadata/schema';
import { batchOptionsSchema, createBatchPlan, nextVideoNumber } from './batch-plan';
import type { BatchPlanOptions } from './batch-plan';
import { renderVideo } from './render-video';
import type { RenderOptions } from './render-video';
import { createRenderSession } from './session';
import type { RenderSession } from './session';

export type RenderBatchOptions = BatchPlanOptions & Omit<RenderOptions, 'generator' | 'seed' | 'id' | 'config'>;

export const renderBatch = async (input: RenderBatchOptions): Promise<BatchManifest> => {
  const options = batchOptionsSchema.parse(input);
  const output = path.resolve(input.output ?? 'out');
  await mkdir(output, { recursive: true });
  // One batch per output root: protects allocation against concurrent CLI invocations.
  const lockPath = path.join(output, '.factory-batch.lock');
  let lock;
  try { lock = await open(lockPath, 'wx'); } catch (error) {
    throw new Error(`Output is locked by another batch: ${lockPath}. If a process crashed, remove this file after checking it has stopped.`, { cause: error });
  }
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() }));
    const plan = createBatchPlan(options, await nextVideoNumber(output));
    const batchId = `batch-${new Date().toISOString().replaceAll(/[:.]/g, '-')}-${plan[0]!.id}`;
    const manifestPath = path.join(output, 'manifests', `${batchId}.json`);
    const manifest: BatchManifest = {
      schemaVersion: 1, id: batchId, seed: options.seed, createdAt: new Date().toISOString(),
      completedAt: null, status: 'running', requested: options.count, videos: [], failures: [],
    };
    await writeJson(manifestPath, batchManifestSchema.parse(manifest));
    let session: RenderSession | undefined;
    try {
      session = await createRenderSession();
      for (const item of plan) {
        try {
          const result = await renderVideo({ ...input, ...item, output }, session);
          manifest.videos.push(result);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          manifest.failures.push({ id: item.id, generator: item.generator, seed: item.seed, error: message });
          console.error(`${item.id} failed: ${message}`);
        }
        await writeJson(manifestPath, batchManifestSchema.parse(manifest));
      }
    } catch (error) {
      const first = plan[0]!;
      manifest.failures.push({ id: first.id, generator: first.generator, seed: first.seed, error: `Batch initialization failed: ${error instanceof Error ? error.message : String(error)}` });
    } finally { if (session) await session.close(); }
    manifest.completedAt = new Date().toISOString();
    manifest.status = manifest.failures.length === 0 ? 'completed' : manifest.videos.length > 0 ? 'partial' : 'failed';
    await writeJson(manifestPath, batchManifestSchema.parse(manifest));
    console.log(`Batch ${manifest.status}: ${manifest.videos.length}/${options.count} videos. Manifest: ${manifestPath}`);
    return manifest;
  } finally {
    await lock.close();
    await rm(lockPath, { force: true });
  }
};
