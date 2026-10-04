import { loopAngle, loopSine } from '../../engine/loop';
import type { PerfectLoopConfig } from './schema';

export const loopPosition = (config: PerfectLoopConfig, index: number, progress: number): { x: number; y: number; scale: number } => {
  const angle = loopAngle(progress, config.cycles * (config.clockwise ? 1 : -1), index / config.count * Math.PI * 2 + config.phase);
  const breathing = 1 + 0.08 * loopSine(progress, 1);
  const radial = config.orbitRadius * 1000 * breathing;
  const radius = config.mode === 'rosette' ? radial * (0.75 + 0.25 * Math.cos(config.harmonic * angle)) : radial;
  return {
    x: 500 + Math.cos(angle) * radius,
    y: 888 + (config.mode === 'wave' ? Math.sin(angle * config.harmonic) : Math.sin(angle)) * radius * 1.35,
    scale: 0.85 + 0.15 * Math.cos(angle),
  };
};
