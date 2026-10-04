import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Scene } from '../../components/Scene';
import type { GridFillConfig } from './schema';

export const GridFill = ({ config }: { config: GridFillConfig }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const time = frame / durationInFrames * config.durationSeconds;
  const spacing = Math.min(780 / config.columns, 1020 / config.rows);
  const size = spacing * (1 - config.gap);
  const rank = new Map(config.order.map((index, order) => [index, order]));
  return <Scene background={config.background}>
    <defs>{config.palette.map((color, i) => <linearGradient id={`tile-${i}`} key={color} x1="0" y1="0" x2="0.8" y2="1"><stop stopColor={color} /><stop offset="1" stopColor={color} stopOpacity="0.65" /></linearGradient>)}</defs>
    {Array.from({ length: config.columns * config.rows }, (_, index) => {
      const col = index % config.columns; const row = Math.floor(index / config.columns);
      const x = 500 + (col - (config.columns - 1) / 2) * spacing;
      const y = 888 + (row - (config.rows - 1) / 2) * spacing;
      const local = time - 0.5 - rank.get(index)! * config.intervalSeconds;
      const scale = local < 0 ? 0 : spring({ frame: local * fps, fps, durationInFrames: Math.round(config.animationSeconds * fps), config: { damping: 13, stiffness: 170, mass: 0.65 } });
      const colorIndex = (row + col) % config.palette.length;
      const offset = config.animation === 'rise' ? (1 - scale) * spacing * 0.4 : 0;
      const rotation = config.shape === 'diamond' ? 45 : config.animation === 'turn' ? (1 - scale) * 90 : 0;
      const effectiveSize = config.shape === 'diamond' ? size * 0.7 : size;
      const Shape = ({ fill }: { fill: string }) => config.shape === 'circle'
        ? <circle r={effectiveSize / 2} fill={fill} />
        : <rect x={-effectiveSize / 2} y={-effectiveSize / 2} width={effectiveSize} height={effectiveSize} rx={effectiveSize * config.cornerRadius} fill={fill} />;
      return <g key={index}>
        <g transform={`translate(${x} ${y}) rotate(${config.shape === 'diamond' ? 45 : 0})`} opacity="0.035"><Shape fill="#ffffff" /></g>
        {local >= 0 ? <g transform={`translate(${x} ${y + offset}) rotate(${rotation}) scale(${Math.max(0.001, scale)})`} opacity={Math.min(1, local / 0.12)}>
          <g transform="translate(0 5)" opacity="0.2"><Shape fill="#000000" /></g>
          <Shape fill={`url(#tile-${colorIndex})`} />
          <path d={`M ${-effectiveSize * 0.24} ${-effectiveSize * 0.27} L ${effectiveSize * 0.20} ${-effectiveSize * 0.27}`} stroke="#ffffff" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
        </g> : null}
      </g>;
    })}
  </Scene>;
};
