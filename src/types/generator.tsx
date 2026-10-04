import type { ComponentType } from 'react';
import type { z } from 'zod';

export type SoundName = 'click' | 'pop' | 'impact' | 'tick' | 'tone' | 'whoosh';
export type AudioEvent = { frame: number; sound: SoundName; pitch: number; gain: number };
export type AudioContext = { fps: number; durationInFrames: number; naturalDuration: number };
export type VideoMetadata = { title: string; category: 'minimal' | 'curiosity' | 'challenge' | 'loop'; hashtags: string[]; loop: boolean };
export type BaseConfig = { seed: number; durationSeconds: number; background: string; palette: string[] };

export interface VideoGenerator<TConfig extends BaseConfig> {
  id: string;
  name: string;
  version: string;
  schema: z.ZodType<TConfig>;
  generate(seed: number): TConfig;
  getDuration(config: TConfig): number;
  getMetadata(config: TConfig): VideoMetadata;
  getAudio(config: TConfig, context: AudioContext): AudioEvent[];
  Component: ComponentType<{ config: TConfig }>;
}

// Erase heterogenous config types only at the registry boundary; each generator stays typed.
export interface RegisteredGenerator {
  id: string;
  name: string;
  version: string;
  schema: z.ZodType;
  generate(seed: number): BaseConfig;
  validate(config: unknown): BaseConfig;
  getDuration(config: unknown): number;
  getMetadata(config: unknown): VideoMetadata;
  getAudio(config: unknown, context: AudioContext): AudioEvent[];
  Component: ComponentType<{ config: unknown }>;
}

export const defineGenerator = <T extends BaseConfig>(generator: VideoGenerator<T>): RegisteredGenerator => {
  const parse = (config: unknown): T => generator.schema.parse(config);
  const Component = generator.Component;
  return {
    id: generator.id, name: generator.name, version: generator.version, schema: generator.schema,
    generate: (seed) => parse(generator.generate(seed)),
    validate: parse,
    getDuration: (config) => generator.getDuration(parse(config)),
    getMetadata: (config) => generator.getMetadata(parse(config)),
    getAudio: (config, context) => generator.getAudio(parse(config), context),
    Component: ({ config }) => <Component config={parse(config)} />,
  };
};
