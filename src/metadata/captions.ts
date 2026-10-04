import { createRandom } from '../engine/random';
import type { VideoMetadata } from '../types/generator';

const captions: Record<VideoMetadata['category'], readonly string[]> = {
  minimal: ['Perfect timing.', 'Oddly satisfying.', 'Everything in its place.'],
  curiosity: ['Watch it come together.', 'One piece at a time.', 'Where will it start?'],
  challenge: ['Wait for the last one.', 'Every landing counts.', 'Watch them settle.'],
  loop: ['Can you spot the loop?', 'Around and around.', 'One more loop.'],
};
export const createCaption = (seed: number, category: VideoMetadata['category'], enabled = true): string =>
  enabled ? createRandom(seed).fork('caption').pick(captions[category]) : '';
