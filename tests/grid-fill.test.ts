import { describe, expect, it } from 'vitest';
import { createGridOrder, gridOrders } from '../src/generators/grid-fill/order';
import { createRandom } from '../src/engine/random';
import { isPermutation } from '../src/types/config';

describe('grid orders', () => {
  it('visits each cell exactly once for square and non-square grids', () => {
    for (const [cols, rows] of [[1, 1], [1, 8], [8, 1], [4, 7], [9, 10]]) {
      for (const strategy of gridOrders) {
        const order = createGridOrder(cols!, rows!, strategy, createRandom(42));
        expect(isPermutation(order, cols! * rows!)).toBe(true);
        expect(order).toEqual(createGridOrder(cols!, rows!, strategy, createRandom(42)));
      }
    }
  });
  it('matches the expected spiral, column and diagonal traversal', () => {
    expect(createGridOrder(3, 3, 'spiral', createRandom(1))).toEqual([0, 1, 2, 5, 8, 7, 6, 3, 4]);
    expect(createGridOrder(2, 3, 'column', createRandom(1))).toEqual([0, 2, 4, 1, 3, 5]);
    expect(createGridOrder(3, 2, 'diagonal', createRandom(1))).toEqual([0, 1, 3, 2, 4, 5]);
  });
});
