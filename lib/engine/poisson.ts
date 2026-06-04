import type { Rng } from './rng';

// Goals per match are modelled as Poisson-distributed — the standard,
// well-validated model for football scorelines.

/** Sample from Poisson(lambda) using Knuth's algorithm with a supplied Rng. */
export function samplePoisson(lambda: number, rng: Rng): number {
  if (lambda <= 0) return 0;
  // Guard against pathological lambdas blowing up the loop.
  const L = Math.exp(-Math.min(lambda, 20));
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng();
  } while (p > L);
  return k - 1;
}
