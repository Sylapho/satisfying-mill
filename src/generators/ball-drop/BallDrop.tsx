import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Scene } from '../../components/Scene';
import type { BallDropConfig } from './schema';

export const BallDrop = ({ config }: { config: BallDropConfig }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const time = frame / durationInFrames * config.durationSeconds;
  const radius = config.radius * 1000;
  const positions = Array.from({ length: config.columns * config.rows }, (_, i) => {
    const row = Math.floor(i / config.columns);
    const x = 500 + (i % config.columns - (config.columns - 1) / 2) * config.spacing * 1000
      + (config.layout === 'staggered' ? (row % 2 - 0.5) * config.spacing * 220 : 0);
    const y = 940 + (row - (config.rows - 1) / 2) * config.spacing * 1000;
    return { x, y, index: i };
  });
  return (
    <Scene background={config.background}>
      <defs>
        {config.palette.map((color, i) => <radialGradient id={`ball-${i}`} key={color} cx="32%" cy="25%" r="75%"><stop stopColor="#ffffff" stopOpacity="0.85" /><stop offset="0.25" stopColor={color} /><stop offset="1" stopColor={color} stopOpacity="0.65" /></radialGradient>)}
      </defs>
      {positions.map(({ x, y, index }) => <g key={`socket-${index}`}><circle cx={x} cy={y + 6} r={radius + 7} fill="#000000" opacity="0.24" /><circle cx={x} cy={y} r={radius + 4} fill="none" stroke="#ffffff" strokeOpacity="0.07" strokeWidth="2" /></g>)}
      {config.order.map((index, order) => {
        const { x, y } = positions[index]!;
        const start = 0.45 + order * config.intervalSeconds;
        const local = (time - start) / config.dropSeconds;
        if (local < 0) return null;
        const fall = Math.min(1, Math.max(0, local));
        const anticipation = order % 4 === 0 ? Math.sin(Math.min(1, fall / 0.18) * Math.PI) * config.anticipation * 1000 : 0;
        const impactFrame = (time - start - config.dropSeconds) * fps;
        const settle = impactFrame < 0 ? 0 : spring({ frame: impactFrame, fps, config: { damping: 11, stiffness: 210, mass: 0.7 } });
        const ballY = local < 1 ? y - 700 * (1 - fall * fall) - anticipation : y + (1 - settle) * radius * 0.30;
        const squash = impactFrame < 0 ? 1 : 1 - (1 - settle) * 0.15;
        const opacity = Math.min(1, local * 8);
        return <g key={index} opacity={opacity}>
          <ellipse cx={x + 4} cy={y + radius * 0.5} rx={radius * (0.65 + fall * 0.3)} ry={radius * 0.22} fill="#000000" opacity={0.1 + fall * 0.25} />
          <ellipse cx={x} cy={ballY} rx={radius / squash} ry={radius * squash} fill={`url(#ball-${order % config.palette.length})`} />
          <ellipse cx={x - radius * 0.23} cy={ballY - radius * 0.3} rx={radius * 0.26} ry={radius * 0.12} fill="#ffffff" opacity="0.32" transform={`rotate(-30 ${x} ${ballY})`} />
          {impactFrame >= 0 && impactFrame < fps * 0.5 ? <circle cx={x} cy={y} r={radius + impactFrame / fps * 55} fill="none" stroke={config.palette[order % config.palette.length]} strokeWidth="2" opacity={0.35 * (1 - impactFrame / (fps * 0.5))} /> : null}
        </g>;
      })}
    </Scene>
  );
};
