import { registry } from '../../src/generators';
import { hashConfig } from '../../src/engine/files';
import { getVideoSettings } from '../../src/config/presets';
import { metadataSchema } from '../../src/metadata/schema';
import type { VideoManifest } from '../../src/metadata/schema';

export const makeManifest = (id = '000001', generatorId = 'ball-drop', seed = 42): VideoManifest => {
  const generator = registry.get(generatorId); const config = generator.generate(seed);
  return metadataSchema.parse({
    schemaVersion: 1, engineVersion: '0.1.0', generatorVersion: generator.version, codeHash: 'a'.repeat(64),
    id, generator: generatorId, seed, createdAt: '2026-10-03T12:00:00.000Z', duration: 6, durationInFrames: 360,
    fps: 60, width: 1080, height: 1920, config, configHash: hashConfig(config), settings: getVideoSettings('tiktok'),
    caption: 'Perfect timing.', hashtags: ['satisfying'], loop: false, audio: true,
    video: `videos/${id}.mp4`, thumbnail: `thumbnails/${id}.jpg`,
  });
};
