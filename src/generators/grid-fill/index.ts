import { defineGenerator } from '../../types/generator';
import { GridFill } from './GridFill';
import { generateGridFill } from './generate';
import { gridFillSchema } from './schema';

export const gridFill = defineGenerator({
  id: 'grid-fill', name: 'GridFill', version: '1.0.0', schema: gridFillSchema, generate: generateGridFill,
  getDuration: (config) => config.durationSeconds,
  getMetadata: () => ({ title: 'A little order', category: 'curiosity', hashtags: ['satisfying', 'generativeart', 'grid'], loop: false }),
  getAudio: (config, context) => config.order.map((index, i) => ({
    frame: Math.round((0.5 + i * config.intervalSeconds + config.animationSeconds * 0.25) / config.durationSeconds * context.durationInFrames),
    sound: 'tick', pitch: 2 ** ((index % config.columns) * 2 / 12), gain: 0.28,
  })),
  Component: GridFill,
});
