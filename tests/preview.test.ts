import { expect, it } from 'vitest';
import { propsForInput, durationFrames } from '../src/remotion/props';
import { getVideoSettings } from '../src/config/presets';
import { registry } from '../src/generators';

it('uses the exact requested configuration, dimensions and clock in Studio', () => {
  const generator = registry.get('ball-drop');
  const input = { generatorId: generator.id, config: generator.generate(123),
    settings: getVideoSettings('fast-preview', { durationSeconds: 3 }), audioEnabled: false };
  const props = propsForInput(generator, input);
  expect(props.config).toEqual(generator.generate(123));
  expect(props.settings).toMatchObject({ width: 360, height: 640, fps: 30 });
  expect(durationFrames(generator, props)).toBe(90);
  expect(props.audioEnabled).toBe(false);
  expect(propsForInput(registry.get('grid-fill'), input).settings.fps).toBe(60);
});
