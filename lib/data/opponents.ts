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

const TIERS: TierSpec[] = [
  { tier: 'title', attack: 90, defense: 88 },
  { tier: 'europe', attack: 80, defense: 78 },
  { tier: 'mid', attack: 66, defense: 64 },
  { tier: 'relegation', attack: 52, defense: 50 },
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
    // deterministic ±3 jitter so clubs within a tier differ
    const j = ((i * 7) % 7) - 3;
    return {
      id: name.toLowerCase().replace(/[^a-z]+/g, '-'),
      name,
      attack: spec.attack + j,
      defense: spec.defense + (((i * 5) % 7) - 3),
      tier: group.tier,
    };
  }),
);

if (OPPONENTS.length !== 19) {
  throw new Error(`Expected 19 opponents, got ${OPPONENTS.length}`);
}
