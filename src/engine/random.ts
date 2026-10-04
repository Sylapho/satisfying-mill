export type WeightedItem<T> = { value: T; weight: number };

export interface Random {
  float(min?: number, max?: number): number;
  int(min: number, max: number): number;
  boolean(probability?: number): boolean;
  pick<T>(items: readonly T[]): T;
  shuffle<T>(items: readonly T[]): T[];
  weighted<T>(items: readonly WeightedItem<T>[]): T;
  fork(namespace: string): Random;
}

export const assertSeed = (seed: number): void => {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new Error('Seed must be an integer between 0 and 4294967295.');
  }
};

// FNV-1a namespaces + Mulberry32. Forks depend on the root seed, not on draw order.
const hashNamespace = (seed: number, namespace: string): number => {
  let hash = (2166136261 ^ seed) >>> 0;
  for (let i = 0; i < namespace.length; i++) {
    hash = Math.imul(hash ^ namespace.charCodeAt(i), 16777619) >>> 0;
  }
  return hash;
};

export const createRandom = (seed: number): Random => {
  assertSeed(seed);
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const range = (min: number, max: number): void => {
    if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) {
      throw new Error(`Invalid random range: ${min}..${max}`);
    }
  };
  const random: Random = {
    float: (min = 0, max = 1) => { range(min, max); return min + next() * (max - min); },
    int: (min, max) => {
      range(min, max);
      if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || max - min > 0xffffffff) {
        throw new Error('Random integer bounds must be safe integers within a 32-bit range.');
      }
      return Math.floor(next() * (max - min + 1)) + min;
    },
    boolean: (probability = 0.5) => {
      if (!Number.isFinite(probability) || probability < 0 || probability > 1) {
        throw new Error('Probability must be between 0 and 1.');
      }
      return next() < probability;
    },
    pick: <T>(items: readonly T[]): T => {
      if (items.length === 0) throw new Error('Cannot pick from an empty array.');
      return items[random.int(0, items.length - 1)]!;
    },
    shuffle: <T>(items: readonly T[]): T[] => {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = random.int(0, i);
        [copy[i], copy[j]] = [copy[j]!, copy[i]!];
      }
      return copy;
    },
    weighted: <T>(items: readonly WeightedItem<T>[]): T => {
      if (items.length === 0 || items.some(({ weight }) => !Number.isFinite(weight) || weight < 0)) {
        throw new Error('Weights must be finite, non-negative and non-empty.');
      }
      const total = items.reduce((sum, item) => sum + item.weight, 0);
      if (!Number.isFinite(total) || total <= 0) throw new Error('At least one weight must be positive.');
      let cursor = next() * total;
      for (const item of items) {
        cursor -= item.weight;
        if (cursor < 0) return item.value;
      }
      return items.findLast((item) => item.weight > 0)!.value;
    },
    fork: (namespace) => createRandom(hashNamespace(seed, namespace)),
  };
  return random;
};
