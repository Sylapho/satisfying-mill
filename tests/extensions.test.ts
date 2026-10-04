import { expect, it } from 'vitest';
import { precalculateSimulation } from '../src/physics/simulation';
import type { PhysicsSimulation } from '../src/physics/simulation';
import { metadataSchema } from '../src/metadata/schema';
import { makeManifest } from './helpers/manifest';

it('precalculates physics with a fixed timestep and one state per frame', () => {
  const adapter: PhysicsSimulation<{ seed: number; velocity: number }, { x: number }> = {
    simulate: (config, clock) => Array.from({ length: clock.durationInFrames }, (_, frame) => ({ x: config.velocity * clock.deltaSeconds * frame })),
  };
  const states = precalculateSimulation(adapter, { seed: 42, velocity: 60 }, 60, 120);
  expect(states[60]!.x).toBe(60);
  expect(states).toEqual(precalculateSimulation(adapter, { seed: 42, velocity: 60 }, 60, 120));
  expect(() => precalculateSimulation({ simulate: () => [] }, { seed: 42 }, 60, 120)).toThrow('expected 120');
});
it('associates explicitly provided analytics with a video manifest', () => {
  const manifest = metadataSchema.parse({ ...makeManifest(), analytics: {
    source: 'manual', observedAt: '2026-10-03T12:00:00.000Z', views: 100, likes: 12, completionRate: 0.85, averageWatchTime: 7,
  } });
  expect(manifest.analytics!.views).toBe(100);
  expect(() => metadataSchema.parse({ ...manifest, analytics: { ...manifest.analytics, completionRate: 1.2 } })).toThrow();
});
