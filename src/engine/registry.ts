import type { RegisteredGenerator } from '../types/generator';
import { createRandom } from './random';

export const createRegistry = (initial: readonly RegisteredGenerator[] = []) => {
  const entries = new Map<string, RegisteredGenerator>();
  const register = (generator: RegisteredGenerator): void => {
    if (!/^[a-z][a-z0-9-]*$/.test(generator.id)) throw new Error(`Invalid generator ID: ${generator.id}`);
    if (entries.has(generator.id)) throw new Error(`Generator already registered: ${generator.id}`);
    entries.set(generator.id, generator);
  };
  initial.forEach(register);
  const get = (id: string): RegisteredGenerator => {
    const generator = entries.get(id);
    if (!generator) throw new Error(`Unknown generator "${id}". Available: ${[...entries.keys()].join(', ')}`);
    return generator;
  };
  const choose = (seed: number, weights?: Record<string, number>): RegisteredGenerator => {
    if (weights) Object.keys(weights).forEach(get);
    return createRandom(seed).fork('generator').weighted(
      [...entries.values()].map((value) => ({ value, weight: weights ? (weights[value.id] ?? 0) : 1 })),
    );
  };
  return { register, get, list: () => [...entries.values()], choose };
};
