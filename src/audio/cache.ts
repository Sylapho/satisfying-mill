import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { hashConfig } from '../engine/files';
import type { AudioOptions } from './schema';
import { audioOptionsSchema } from './schema';
import { AUDIO_VERSION, synthesizeTimeline, wavDataUri } from './synthesize';

export const createAudioTrack = async (input: AudioOptions): Promise<{ file: string; src: string }> => {
  const options = audioOptionsSchema.parse(input);
  const key = hashConfig({ version: AUDIO_VERSION, ...options });
  const directory = path.resolve('generated/cache/audio');
  await mkdir(directory, { recursive: true });
  const file = path.join(directory, `${key}.wav`);
  let bytes: Uint8Array;
  try { bytes = await readFile(file); } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
    bytes = synthesizeTimeline(options);
    await writeFile(file, bytes);
  }
  return { file, src: wavDataUri(bytes) };
};
