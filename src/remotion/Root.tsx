import { Composition, getInputProps } from 'remotion';
import { registry } from '../generators';
import { compositionPropsSchema, propsForInput, durationFrames } from './props';
import { createVideoComposition } from './VideoComposition';

const compositions = registry.list().map((generator) => ({ generator, Component: createVideoComposition(generator) }));

export const Root = () => {
  const input = getInputProps();
  const requestedId = input.generatorId;
  if (requestedId !== undefined) registry.get(String(requestedId));
  return <>
  {compositions.filter(({ generator }) => requestedId === undefined || generator.id === requestedId).map(({ generator, Component }) => {
    const defaults = propsForInput(generator, input);
    return <Composition key={generator.id} id={generator.id} component={Component}
      defaultProps={defaults} schema={compositionPropsSchema.extend({ config: generator.schema })}
      width={defaults.settings.width} height={defaults.settings.height} fps={defaults.settings.fps}
      durationInFrames={durationFrames(generator, defaults)}
      calculateMetadata={({ props }) => {
        const parsed = compositionPropsSchema.parse(props);
        generator.validate(parsed.config);
        return { width: parsed.settings.width, height: parsed.settings.height, fps: parsed.settings.fps, durationInFrames: durationFrames(generator, parsed) };
      }} />;
  })}
</>;
};
