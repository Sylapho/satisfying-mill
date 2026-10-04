import type { ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';

export const Scene = ({ background, children }: { background: string; children: ReactNode }) => (
  <AbsoluteFill style={{ backgroundColor: background, justifyContent: 'center', alignItems: 'center' }}>
    <svg viewBox="0 0 1000 1777.7778" width="100%" height="100%" style={{ overflow: 'hidden' }}>
      <defs>
        <radialGradient id="ambient"><stop stopColor="#ffffff" stopOpacity="0.055" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="500" cy="850" rx="650" ry="800" fill="url(#ambient)" />
      {children}
    </svg>
  </AbsoluteFill>
);
