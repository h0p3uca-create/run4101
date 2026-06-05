import type { Opponent } from '../types';

// 19 generic opponents (no real club names/marks). Tiered to mimic a real
// top-flight spread: a few title contenders, a Europe pack, a big mid-table,
// and a relegation scrap. attack/defense share the 0–100 scale with team
// strength (see lib/engine/ratings.ts).
//
// Tier strength is jittered per club so the league isn't perfectly uniform.

interface TierSpec {
  tier: Opponent['tier'];
  attack: number;
  defense: number;
}

// Main mode draws club ERAS, team strength is star-weighted, and curated rating
// overrides spread the top tier up to 95. This boost keeps 101 a rare feat after
// all three: a GLOBAL-optimal XI reaches it ~10% of seasons, random XIs ~0%. The
// engine keys on strength DIFFERENCES, so a uniform lift preserves balance.
// Re-tune: npm run calibrate:eras.
const ERA_OPPONENT_BOOST = 2;

const TIERS: TierSpec[] = [
  { tier: 'title', attack: 90 + ERA_OPPONENT_BOOST, defense: 88 + ERA_OPPONENT_BOOST },
  { tier: 'europe', attack: 80 + ERA_OPPONENT_BOOST, defense: 78 + ERA_OPPONENT_BOOST },
  { tier: 'mid', attack: 66 + ERA_OPPONENT_BOOST, defense: 64 + ERA_OPPONENT_BOOST },
  { tier: 'relegation', attack: 52 + ERA_OPPONENT_BOOST, defense: 50 + ERA_OPPONENT_BOOST },
];

// names[i] count must sum to 19
const ROSTER: { tier: Opponent['tier']; names: string[] }[] = [
  { tier: 'title', names: ['North Albion', 'Crown Park', 'Riverside United'] },
  {
    tier: 'europe',
    names: ['Harbour City', 'Kingsgate', 'Sovereign Rovers', 'Vale Athletic'],
  },
  {
    tier: 'mid',
    names: [
      'Ironworks FC',
      'Castleton',
      'Meadowfield',
      'Port Haven',
      'Granite City',
      'Ashford Town',
      'Thornbury',
      'Westcliff',
    ],
  },
  {
    tier: 'relegation',
    names: ['Marsh End', 'Coldharbour', 'Pennine Wanderers', 'Old Siding'],
  },
];

function tierSpec(tier: Opponent['tier']): TierSpec {
  return TIERS.find((t) => t.tier === tier)!;
}

export const OPPONENTS: Opponent[] = ROSTER.flatMap((group) =>
  group.names.map((name, i): Opponent => {
    const spec = tierSpec(group.tier);
    // deterministic ±3 jitter so clubs within a tier differ (multipliers
    // coprime to 7 so the modulo actually varies per index)
    return {
      id: name.toLowerCase().replace(/[^a-z]+/g, '-'),
      name,
      attack: spec.attack + (((i * 5) % 7) - 3),
      defense: spec.defense + (((i * 3) % 7) - 3),
      tier: group.tier,
    };
  }),
);

if (OPPONENTS.length !== 19) {
  throw new Error(`Expected 19 opponents, got ${OPPONENTS.length}`);
}

// ── Difficulty tiers ───────────────────────────────────────────────────────
// An optional uniform lift on top of the calibrated baseline. Normal (+0) is
// the tuned ~13%-optimal-hit setting; Hard/Brutal raise every opponent's
// attack & defense, so the same XI scores fewer points. The engine keys on
// strength DIFFERENCES, so this just shifts the whole curve down.
export type Difficulty = 'normal' | 'hard' | 'brutal';

export const DIFFICULTIES: { id: Difficulty; label: string; boost: number }[] = [
  { id: 'normal', label: 'Normal', boost: 0 },
  { id: 'hard', label: 'Hard', boost: 2 },
  { id: 'brutal', label: 'Brutal', boost: 4 },
];

export function difficultyBoost(d: Difficulty): number {
  return DIFFICULTIES.find((x) => x.id === d)?.boost ?? 0;
}

/** Apply a difficulty lift to a set of opponents (returns the same array at Normal). */
export function withDifficulty(opps: Opponent[], d: Difficulty): Opponent[] {
  const b = difficultyBoost(d);
  return b ? opps.map((o) => ({ ...o, attack: o.attack + b, defense: o.defense + b })) : opps;
}
