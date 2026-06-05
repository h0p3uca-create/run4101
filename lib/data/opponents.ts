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

// Main mode draws club ERAS (peak-window squads, with the 90+ cluster thinned
// so each great era has only ~1–3 elites). This small boost keeps 101 a rare
// feat: a GLOBAL-optimal XI reaches it ~8% of seasons, random XIs ~0%. The
// engine keys on strength DIFFERENCES, so a uniform lift preserves balance.
// Re-tune with: npm run calibrate:eras.
const ERA_OPPONENT_BOOST = 1;

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
