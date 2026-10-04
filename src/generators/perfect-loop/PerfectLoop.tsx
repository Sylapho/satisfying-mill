import { useCurrentFrame, useVideoConfig } from 'remotion';
import { Scene } from '../../components/Scene';
import { loopProgress } from '../../engine/loop';
import { loopPosition } from './position';
import type { PerfectLoopConfig } from './schema';

export const PerfectLoop = ({ config }: { config: PerfectLoopConfig }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = loopProgress(frame, durationInFrames);
  return <Scene background={config.background}>
    <defs>{config.palette.map((color, i) => <radialGradient id={`orb-${i}`} key={color} cx="30%" cy="25%" r="80%"><stop stopColor="#ffffff" /><stop offset="0.3" stopColor={color} /><stop offset="1" stopColor={color} stopOpacity="0.5" /></radialGradient>)}</defs>
    <circle cx="500" cy="888" r="7" fill="#ffffff" opacity="0.28" />
    {Array.from({ length: config.count }, (_, index) => {
      const color = config.palette[index % config.palette.length];
      const { x, y, scale } = loopPosition(config, index, progress);
      const radius = config.objectRadius * 1000 * scale;
      return <g key={index}>
        {Array.from({ length: config.trails }, (_, trail) => {
          const position = loopPosition(config, index, progress - (trail + 1) * 0.004);
          return <circle key={trail} cx={position.x} cy={position.y} r={radius * (1 - (trail + 1) / (config.trails + 1))} fill={color} opacity={0.14 * (1 - trail / config.trails)} />;
        }).reverse()}
        <circle cx={x + 3} cy={y + 5} r={radius} fill="#000000" opacity="0.25" />
        <circle cx={x} cy={y} r={radius} fill={`url(#orb-${index % config.palette.length})`} />
      </g>;
    })}
  </Scene>;
};
