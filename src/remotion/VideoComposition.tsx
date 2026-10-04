import { useMemo } from 'react';
import { Audio } from 'remotion';
import { audioTimelineFor } from '../audio/timeline';
import { synthesizeTimeline, wavDataUri } from '../audio/synthesize';
import type { RegisteredGenerator } from '../types/generator';
import type { CompositionProps } from './props';

export const createVideoComposition = (generator: RegisteredGenerator) => {
  const GeneratorComponent = generator.Component;
  return function VideoComposition(props: CompositionProps) {
    const audio = useMemo(() => {
      if (!props.audioEnabled) return null;
      return props.audioSrc ?? wavDataUri(synthesizeTimeline(audioTimelineFor(generator, props)));
    }, [props.audioEnabled, props.audioSrc, props.config, props.settings]);
    return <>
      <GeneratorComponent config={props.config} />
      {audio ? <Audio src={audio} /> : null}
    </>;
  };
};
