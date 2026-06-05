import type { Player, Position, TeamStrength } from '../types';
import { RATING_WEIGHTS, STAR_WEIGHT } from './config';

// A position group's contribution: blend its average with its BEST player, so a
// standout (a 91 striker, a 90 keeper) lifts the team above a flat mean. `star`
// is the weight on the best player (0 = pure mean, 1 = only the star).
function starBy(players: Player[], pos: Position, key: 'att' | 'def', star: number): number {
  const group = players.filter((p) => p.pos === pos);
  if (group.length === 0) return 0;
  const mean = group.reduce((s, p) => s + p[key], 0) / group.length;
  const best = Math.max(...group.map((p) => p[key]));
  return (1 - star) * mean + star * best;
}

// When a formation has no players in a group (e.g. 3-at-the-back lowering DEF
// weight), we renormalise so total weight stays 1 and the axis isn't deflated.
function weighted(
  parts: { value: number; weight: number }[],
): number {
  const active = parts.filter((p) => p.value > 0);
  const totalW = active.reduce((s, p) => s + p.weight, 0);
  if (totalW === 0) return 0;
  return active.reduce((s, p) => s + p.value * p.weight, 0) / totalW;
}

/** Reduce a selected XI to a single attack & defense rating (0–100). */
export function teamStrength(xi: Player[]): TeamStrength {
  const wa = RATING_WEIGHTS.attack;
  const wd = RATING_WEIGHTS.defense;
  const sa = STAR_WEIGHT.attack;
  const sd = STAR_WEIGHT.defense;

  const attack = weighted([
    { value: starBy(xi, 'FWD', 'att', sa), weight: wa.FWD },
    { value: starBy(xi, 'MID', 'att', sa), weight: wa.MID },
    { value: starBy(xi, 'DEF', 'att', sa), weight: wa.DEF },
  ]);

  const defense = weighted([
    { value: starBy(xi, 'GK', 'def', sd), weight: wd.GK },
    { value: starBy(xi, 'DEF', 'def', sd), weight: wd.DEF },
    { value: starBy(xi, 'MID', 'def', sd), weight: wd.MID },
  ]);

  return {
    attack: Math.round(attack * 10) / 10,
    defense: Math.round(defense * 10) / 10,
  };
}
