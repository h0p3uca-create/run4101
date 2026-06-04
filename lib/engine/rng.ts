// Deterministic, seedable PRNG so a season (and a daily draft) is fully
// reproducible and shareable via a seed string.

/** xfnv1a string hash → 32-bit unsigned seed. */
export function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

export type Rng = () => number;

/** mulberry32 — small, fast, good-enough PRNG returning float in [0, 1). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Build an Rng from any seed string. */
export function rngFromSeed(seed: string): Rng {
  return mulberry32(hashSeed(seed));
}

/** Today's deterministic seed for the daily challenge (UTC date). */
export function dailySeed(date = new Date()): string {
  return `daily-${date.toISOString().slice(0, 10)}`;
}
