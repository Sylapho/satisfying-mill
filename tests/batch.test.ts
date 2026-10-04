import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';
import { createBatchPlan, nextVideoNumber } from '../src/render/batch-plan';
import { configurationSimilarity } from '../src/quality/configuration';

it('creates repeatable plans with unique seeds, names and distinct configurations', () => {
  const first = createBatchPlan({ count: 50, seed: 42 });
  expect(first).toEqual(createBatchPlan({ count: 50, seed: 42 }));
  expect(new Set(first.map((item) => item.id)).size).toBe(50);
  expect(new Set(first.map((item) => item.seed)).size).toBe(50);
  expect(first[0]!.id).toBe('000001');
  expect(createBatchPlan({ count: 1 }, 105)[0]!.id).toBe('000105');
});
it('supports fixed generators and rejects impossible plans', () => {
  expect(createBatchPlan({ count: 5, generator: 'ball-drop' }).every((video) => video.generator === 'ball-drop')).toBe(true);
  expect(() => createBatchPlan({ count: 0 })).toThrow();
  expect(() => createBatchPlan({ generator: 'missing' })).toThrow();
});
it('ignores seeds when comparing configurations', () => {
  expect(configurationSimilarity({ seed: 1, rows: 5, palette: ['#ffffff'] }, { seed: 2, rows: 5, palette: ['#ffffff'] })).toBe(1);
  expect(configurationSimilarity({ shape: 'circle', rows: 3 }, { shape: 'square', rows: 7 })).toBeLessThan(0.5);
});
it('allocates names after existing video, metadata or thumbnail files', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'factory-test-'));
  try {
    expect(await nextVideoNumber(directory)).toBe(1);
    await mkdir(path.join(directory, 'metadata'));
    await writeFile(path.join(directory, 'metadata', '000021.json'), '{}');
    expect(await nextVideoNumber(directory)).toBe(22);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
