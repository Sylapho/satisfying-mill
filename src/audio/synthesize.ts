import { createRandom } from '../engine/random';
import type { Random } from '../engine/random';
import type { SoundName } from '../types/generator';
import { audioOptionsSchema } from './schema';
import type { AudioOptions } from './schema';

export const AUDIO_VERSION = '1.0.0';
const lengths: Record<SoundName, number> = { click: 0.04, pop: 0.15, impact: 0.28, tick: 0.07, tone: 0.48, whoosh: 0.6 };
const soundSample = (sound: SoundName, time: number, pitch: number, random: Random): number => {
  const end = lengths[sound];
  const attack = Math.min(1, time / 0.003);
  const release = Math.min(1, (end - time) / 0.012);
  const envelope = attack * release;
  const sine = (frequency: number) => Math.sin(Math.PI * 2 * frequency * pitch * time);
  switch (sound) {
    case 'click': return random.float(-1, 1) * Math.exp(-time * 180) * envelope * 0.65;
    case 'pop': {
      // Integral of an exponentially falling frequency; pitch changes the oscillator phase.
      const phase = 2 * Math.PI * pitch * (100 * time + 520 * 0.018 * (1 - Math.exp(-time / 0.018)));
      return Math.sin(phase) * Math.exp(-time * 27) * envelope * 0.8;
    }
    case 'impact': return (sine(74) * 0.7 + random.float(-1, 1) * 0.3) * Math.exp(-time * 20) * envelope;
    case 'tick': return (sine(1300) + sine(2100) * 0.35) * Math.exp(-time * 85) * envelope * 0.5;
    case 'tone': return (sine(440) * 0.75 + sine(880) * 0.15) * Math.sin(Math.PI * time / end) ** 2 * envelope;
    case 'whoosh': return (random.float(-1, 1) * 0.65 + sine(160 + 250 * time) * 0.15) * Math.sin(Math.PI * time / end) ** 2 * envelope;
  }
};

export const encodeWav = (samples: Float32Array, sampleRate: number): Uint8Array => {
  const bytes = new Uint8Array(44 + samples.length * 2);
  const view = new DataView(bytes.buffer);
  const ascii = (offset: number, value: string) => { for (let i = 0; i < value.length; i++) bytes[offset + i] = value.charCodeAt(i); };
  ascii(0, 'RIFF'); view.setUint32(4, bytes.length - 8, true); ascii(8, 'WAVE'); ascii(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); ascii(36, 'data'); view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]!));
    view.setInt16(44 + i * 2, Math.round(sample * (sample < 0 ? 32768 : 32767)), true);
  }
  return bytes;
};

export const synthesizeTimeline = (input: AudioOptions): Uint8Array => {
  const options = audioOptionsSchema.parse(input);
  const samples = new Float32Array(Math.round(options.durationInFrames / options.fps * options.sampleRate));
  options.events.forEach((event, eventIndex) => {
    const start = Math.round(event.frame / options.fps * options.sampleRate);
    const count = Math.ceil(lengths[event.sound] * options.sampleRate);
    const random = createRandom(options.seed).fork(`sound-${eventIndex}-${event.sound}`);
    for (let i = 0; i < count; i++) {
      const position = start + i;
      if (!options.loop && position >= samples.length) break;
      const target = position % samples.length;
      samples[target] = samples[target]! + soundSample(event.sound, i / options.sampleRate, event.pitch, random) * event.gain;
    }
  });
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  if (peak > 0.92) for (let i = 0; i < samples.length; i++) samples[i] = samples[i]! * 0.92 / peak;
  return encodeWav(samples, options.sampleRate);
};

// Node 22+ and browsers both implement btoa. Chunking avoids argument/stack limits.
export const wavDataUri = (bytes: Uint8Array): string => {
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += 8192) chunks.push(String.fromCharCode(...bytes.subarray(i, i + 8192)));
  return `data:audio/wav;base64,${btoa(chunks.join(''))}`;
};
