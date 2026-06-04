import type { Player, Position, TeamStrength } from '../types';
import { RATING_WEIGHTS } from './config';

function meanBy(players: Player[], pos: Position, key: 'att' | 'def'): number {
  const group = players.filter((p) => p.pos === pos);
  if (group.length === 0) return 0;
  return group.reduce((s, p) => s + p[key], 0) / group.length;
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

  const attack = weighted([
    { value: meanBy(xi, 'FWD', 'att'), weight: wa.FWD },
    { value: meanBy(xi, 'MID', 'att'), weight: wa.MID },
    { value: meanBy(xi, 'DEF', 'att'), weight: wa.DEF },
  ]);

  const defense = weighted([
    { value: meanBy(xi, 'GK', 'def'), weight: wd.GK },
    { value: meanBy(xi, 'DEF', 'def'), weight: wd.DEF },
    { value: meanBy(xi, 'MID', 'def'), weight: wd.MID },
  ]);

  return {
    attack: Math.round(attack * 10) / 10,
    defense: Math.round(defense * 10) / 10,
  };
}
