import { z } from 'zod';

export const simulationClockSchema = z.object({
  fps: z.number().int().min(12).max(120), durationInFrames: z.number().int().positive(),
  seed: z.number().int().min(0).max(0xffffffff),
}).strict();
export type SimulationClock = z.infer<typeof simulationClockSchema> & { deltaSeconds: number };
export interface PhysicsSimulation<TConfig, TFrameState> {
  simulate(config: TConfig, clock: SimulationClock): readonly TFrameState[];
}

// Call once before rendering. Frame components read states[frame], never wall-clock time.
export const precalculateSimulation = <TConfig extends { seed: number }, TFrameState>(
  adapter: PhysicsSimulation<TConfig, TFrameState>, config: TConfig, fps: number, durationInFrames: number,
): readonly TFrameState[] => {
  const options = simulationClockSchema.parse({ seed: config.seed, fps, durationInFrames });
  const states = adapter.simulate(config, { ...options, deltaSeconds: 1 / options.fps });
  if (states.length !== durationInFrames) throw new Error(`Simulation returned ${states.length} states; expected ${durationInFrames}.`);
  return states;
};
