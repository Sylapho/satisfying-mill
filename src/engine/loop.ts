export const TAU = 2 * Math.PI;
export const loopProgress = (frame: number, durationInFrames: number): number => {
  if (!Number.isFinite(frame) || !Number.isInteger(durationInFrames) || durationInFrames < 1) {
    throw new Error('Loop requires a finite frame and a positive integer duration.');
  }
  return ((frame % durationInFrames) + durationInFrames) % durationInFrames / durationInFrames;
};
export const loopAngle = (progress: number, cycles = 1, phase = 0): number => TAU * cycles * progress + phase;
export const loopSine = (progress: number, cycles = 1, phase = 0): number => Math.sin(loopAngle(progress, cycles, phase));
export const loopCosine = (progress: number, cycles = 1, phase = 0): number => Math.cos(loopAngle(progress, cycles, phase));
