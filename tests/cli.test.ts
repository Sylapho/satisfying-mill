import { expect, it } from 'vitest';
import { parseCli } from '../src/cli/options';

it('parses the requested command examples and presets', () => {
  const render = parseCli(['render', 'ball-drop', '--seed', '42']);
  expect(render.settings).toMatchObject({ width: 1080, height: 1920, fps: 60 });
  expect(render.seed).toBe(42); expect(render.audio).toBe(true);
  expect(parseCli(['batch', '--count', '50']).count).toBe(50);
  expect(parseCli(['render', 'perfect-loop', '--preset', 'high-quality']).settings.crf).toBe(14);
  expect(parseCli(['preview', 'grid-fill', '--no-audio', '--fps', '30', '--duration', '3']).settings).toMatchObject({ fps: 30, durationSeconds: 3 });
  expect(parseCli(['render', 'ball-drop', '--hashtags', '#art,satisfying', '--no-captions']).hashtags).toEqual(['art', 'satisfying']);
});
it('rejects invalid seeds, options and settings before rendering', () => {
  for (const args of [['--seed', '-1'], ['--seed', 'abc'], ['--seed', '4294967296'], ['--fps', '0'], ['--count', '0'], ['--concurrency', '20'], ['--preset', 'unknown'], ['--typo']]) {
    expect(() => parseCli(['render', 'ball-drop', ...args])).toThrow();
  }
});
