import { defineGenerator } from '../../types/generator';
import { BallDrop } from './BallDrop';
import { generateBallDrop } from './generate';
import { ballDropSchema } from './schema';

export const ballDrop = defineGenerator({
  id: 'ball-drop', name: 'BallDrop', version: '1.0.0', schema: ballDropSchema,
  generate: generateBallDrop,
  getDuration: (config) => config.durationSeconds,
  getMetadata: () => ({ title: 'Perfect landing', category: 'challenge', hashtags: ['satisfying', 'procedural', 'balldrop'], loop: false }),
  getAudio: (config, context) => config.order.map((_, i) => ({
    frame: Math.round((0.45 + i * config.intervalSeconds + config.dropSeconds) / config.durationSeconds * context.durationInFrames),
    sound: 'pop', pitch: 2 ** ((i % 8) * 2 / 12), gain: 0.5,
  })),
  Component: BallDrop,
});
