import { expect, it } from 'vitest';
import { soundNames } from '../src/audio/schema';
import { synthesizeTimeline, wavDataUri } from '../src/audio/synthesize';
import { audioTimelineFor } from '../src/audio/timeline';
import { defaultPropsFor } from '../src/remotion/props';
import { registry } from '../src/generators';

it('generates deterministic PCM16 WAV for every sound with bounded samples', () => {
  for (const sound of soundNames) {
    const options = { events: [{ frame: 10, sound, pitch: 1.2, gain: 0.8 }], seed: 42, fps: 30, durationInFrames: 30, sampleRate: 8000 };
    const bytes = synthesizeTimeline(options);
    expect(bytes).toEqual(synthesizeTimeline(options));
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe('RIFF');
    expect(new TextDecoder().decode(bytes.slice(8, 12))).toBe('WAVE');
    expect(bytes.length).toBe(44 + 8000 * 2);
    const view = new DataView(bytes.buffer);
    expect(view.getUint16(34, true)).toBe(16);
    expect(view.getUint32(24, true)).toBe(8000);
    expect(bytes.slice(44, 44 + 10 * 8000 / 30 * 2).every((value) => value === 0)).toBe(true);
    expect(bytes.slice(44).some((value) => value !== 0)).toBe(true);
    expect(wavDataUri(bytes)).toBe(`data:audio/wav;base64,${Buffer.from(bytes).toString('base64')}`);
    for (let i = 44; i < bytes.length; i += 2) expect(Math.abs(view.getInt16(i, true))).toBeLessThanOrEqual(32768);
  }
});
it('changes noise with seed and rejects out-of-range events', () => {
  const options = { events: [{ frame: 0, sound: 'whoosh' as const, pitch: 1, gain: 1 }], seed: 1, fps: 30, durationInFrames: 30, sampleRate: 8000 };
  expect(synthesizeTimeline(options)).not.toEqual(synthesizeTimeline({ ...options, seed: 2 }));
  expect(() => synthesizeTimeline({ ...options, events: [{ ...options.events[0]!, frame: 30 }] })).toThrow();
});
it('wraps audio tails into the start of looping timelines', () => {
  const options = { events: [{ frame: 29, sound: 'tone' as const, pitch: 1, gain: 0.4 }], seed: 1, fps: 30, durationInFrames: 30, sampleRate: 8000 };
  const normal = synthesizeTimeline(options); const loop = synthesizeTimeline({ ...options, loop: true });
  expect(normal.slice(44, 500).every((sample) => sample === 0)).toBe(true);
  expect(loop.slice(44, 500).some((sample) => sample !== 0)).toBe(true);
});
it('scales generator events with fps and requested duration', () => {
  for (const generator of registry.list()) {
    const props = defaultPropsFor(generator);
    props.settings = { ...props.settings, fps: 30, durationSeconds: 3 };
    const timeline = audioTimelineFor(generator, props);
    expect(timeline.durationInFrames).toBe(90);
    expect(timeline.events.every((event) => event.frame >= 0 && event.frame < 90)).toBe(true);
    expect(() => synthesizeTimeline({ ...timeline, sampleRate: 8000 })).not.toThrow();
  }
});
