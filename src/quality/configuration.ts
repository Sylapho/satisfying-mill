// Each top-level parameter has equal weight; seed alone never counts as variation.
const similarity = (a: unknown, b: unknown): number => {
  if (a === b) return 1;
  if (typeof a === 'number' && typeof b === 'number') return 1 - Math.min(1, Math.abs(a - b) / Math.max(1, Math.abs(a), Math.abs(b)));
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return 0;
    return a.length === 0 ? 1 : a.reduce<number>((sum, value, i) => sum + similarity(value, b[i]), 0) / a.length;
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const first = a as Record<string, unknown>; const second = b as Record<string, unknown>;
    const keys = [...new Set([...Object.keys(first), ...Object.keys(second)])].filter((key) => key !== 'seed');
    return keys.length === 0 ? 1 : keys.reduce((sum, key) => sum + similarity(first[key], second[key]), 0) / keys.length;
  }
  return 0;
};
export const configurationSimilarity = (first: unknown, second: unknown): number => similarity(first, second);
