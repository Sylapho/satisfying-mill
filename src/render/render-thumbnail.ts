import { renderStill } from '@remotion/renderer';
import type { VideoConfig } from 'remotion';
import type { CompositionProps } from '../remotion/props';
import type { RenderSession } from './session';

export const renderThumbnail = async (session: RenderSession, composition: VideoConfig, props: CompositionProps, output: string): Promise<void> => {
  await renderStill({ serveUrl: session.serveUrl, puppeteerInstance: session.browser,
    composition, inputProps: props, frame: Math.floor(composition.durationInFrames * 0.78),
    imageFormat: 'jpeg', output, jpegQuality: 90, scale: 0.5, logLevel: 'warn',
  });
};
