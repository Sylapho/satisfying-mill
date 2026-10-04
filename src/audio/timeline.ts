import type { CompositionProps } from '../remotion/props';
import { durationFrames } from '../remotion/props';
import type { RegisteredGenerator } from '../types/generator';
import type { AudioOptions } from './schema';

export const audioTimelineFor = (generator: RegisteredGenerator, props: CompositionProps): AudioOptions => {
  const config = generator.validate(props.config);
  const frames = durationFrames(generator, props);
  return {
    seed: config.seed, fps: props.settings.fps, durationInFrames: frames, sampleRate: 48000,
    loop: generator.getMetadata(config).loop,
    events: generator.getAudio(config, { fps: props.settings.fps, durationInFrames: frames, naturalDuration: generator.getDuration(config) }),
  };
};
