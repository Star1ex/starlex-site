// Deterministic, dependency-free PRNG utilities.
//
// Everything here is pure and seed-stable: the same string always yields the
// same stream. That property is what lets the generative workspace avatar be
// "computed once, identical forever" with zero server cost — we persist only a
// tiny seed/variant token and re-derive the picture on the client.

/** xmur3 string hash → 32-bit seed generator. */
export function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

/** mulberry32 — fast, well-distributed 32-bit PRNG. Returns floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A seeded random source bound to a string seed. */
export interface Rng {
  /** float in [0, 1) */
  next(): number;
  /** float in [min, max) */
  range(min: number, max: number): number;
  /** integer in [min, max] inclusive */
  int(min: number, max: number): number;
  /** uniform pick from a list */
  pick<T>(items: readonly T[]): T;
  /** true with probability p */
  chance(p: number): boolean;
}

export function createRng(seed: string): Rng {
  const seedFn = xmur3(seed);
  const rand = mulberry32(seedFn());
  const range = (min: number, max: number) => min + rand() * (max - min);
  return {
    next: rand,
    range,
    int: (min, max) => Math.floor(range(min, max + 1)),
    pick: (items) => items[Math.floor(rand() * items.length)],
    chance: (p) => rand() < p,
  };
}

/** Stable hue (0–359) derived purely from a string. */
export function hueFromString(str: string): number {
  return xmur3(str)() % 360;
}
