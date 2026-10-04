import { defineGenerator } from '../../types/generator';
import { PerfectLoop } from './PerfectLoop';
import { generatePerfectLoop } from './generate';
import { perfectLoopSchema } from './schema';

export const perfectLoop = defineGenerator({
  id: 'perfect-loop', name: 'PerfectLoop', version: '1.0.0', schema: perfectLoopSchema, generate: generatePerfectLoop,
  getDuration: (config) => config.durationSeconds,
  getMetadata: () => ({ title: 'Endless motion', category: 'loop', hashtags: ['satisfying', 'perfectloop', 'generativeart'], loop: true }),
  getAudio: (_config, context) => Array.from({ length: 8 }, (_, i) => ({
    frame: Math.round(i / 8 * context.durationInFrames), sound: 'tone', pitch: 2 ** ([0, 4, 7, 12, 7, 4, 2, 7][i]! / 12), gain: 0.18,
  })),
  Component: PerfectLoop,
});
