import type { Random } from './random';

const palettes = [
  ['#ffbd69', '#ff6b6b', '#ffd9a0', '#c1f2b0', '#ff8d73'],
  ['#70e1d0', '#a0c4ff', '#bdb2ff', '#d4f0fc', '#62b6cb'],
  ['#f7c9d9', '#cbb2fe', '#ffd6a5', '#fb8fa6', '#ffe8ef'],
  ['#d4ed6d', '#9ce5cb', '#f9ef95', '#b8df79', '#75c9b7'],
] as const;
export const generatePalette = (random: Random): string[] => [...random.pick(palettes)];
export const generateBackground = (random: Random): string => random.pick(['#101820', '#151525', '#13251f', '#221a24']);
