import type { Random } from '../../engine/random';

export const gridOrders = ['row', 'column', 'spiral', 'center', 'corners', 'random', 'diagonal'] as const;
export type GridOrder = typeof gridOrders[number];

export const createGridOrder = (columns: number, rows: number, strategy: GridOrder, random: Random): number[] => {
  const indices = Array.from({ length: columns * rows }, (_, i) => i);
  const x = (i: number) => i % columns;
  const y = (i: number) => Math.floor(i / columns);
  if (strategy === 'row') return indices;
  if (strategy === 'column') return indices.sort((a, b) => x(a) - x(b) || y(a) - y(b));
  if (strategy === 'random') return random.shuffle(indices);
  if (strategy === 'diagonal') return indices.sort((a, b) => x(a) + y(a) - x(b) - y(b) || a - b);
  if (strategy === 'center') {
    const distance = (i: number) => (x(i) - (columns - 1) / 2) ** 2 + (y(i) - (rows - 1) / 2) ** 2;
    return indices.sort((a, b) => distance(a) - distance(b) || a - b);
  }
  if (strategy === 'corners') {
    const distance = (i: number) => Math.min(x(i), columns - 1 - x(i)) ** 2 + Math.min(y(i), rows - 1 - y(i)) ** 2;
    return indices.sort((a, b) => distance(a) - distance(b) || a - b);
  }
  const result: number[] = [];
  let left = 0; let right = columns - 1; let top = 0; let bottom = rows - 1;
  while (left <= right && top <= bottom) {
    for (let col = left; col <= right; col++) result.push(top * columns + col);
    top++;
    for (let row = top; row <= bottom; row++) result.push(row * columns + right);
    right--;
    if (top <= bottom) { for (let col = right; col >= left; col--) result.push(bottom * columns + col); bottom--; }
    if (left <= right) { for (let row = bottom; row >= top; row--) result.push(row * columns + left); left++; }
  }
  return result;
};
