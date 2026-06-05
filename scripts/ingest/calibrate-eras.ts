// Calibrate MAIN (era) mode: after buffing era ratings, sweep an opponent
// strength boost and report how often a globally-optimal XI and a typical XI
// reach 101. Main mode lets you roll freely, so a determined player can
// assemble a near-global-best XI — 101 should be reachable with the best XI but
// far from guaranteed (target ~8–18%), and basically out of reach for random XIs.
//
// Run: npx tsx scripts/ingest/calibrate-eras.ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { simulateSeason } from '../../lib/engine/simulate';
import { teamStrength } from '../../lib/engine/ratings';
import { getFormation } from '../../lib/data/formations';
import { rngFromSeed } from '../../lib/engine/rng';
import { TARGET_POINTS } from '../../lib/engine/config';
import { OPPONENTS } from '../../lib/data/opponents';
import type { Opponent, Player, Position } from '../../lib/types';

interface EraSource { key: string; label: string; squad: Player[] }
const pool = JSON.parse(
  readFileSync(join('lib', 'data', 'pool.json'), 'utf-8'),
) as EraSource[];
const allPlayers = pool.flatMap((s) => s.squad);

const SLOTS = getFormation('4-3-3').slots;
const posKey = (p: Player) =>
  p.pos === 'GK' || p.pos === 'DEF' ? p.def * 0.6 + p.att * 0.4 : p.att * 0.7 + p.def * 0.3;

function pickBest(playersByPos: Player[]): Player[] {
  const by = (pos: Position, n: number) =>
    playersByPos.filter((p) => p.pos === pos).sort((a, b) => posKey(b) - posKey(a)).slice(0, n);
  return [...by('GK', SLOTS.GK), ...by('DEF', SLOTS.DEF), ...by('MID', SLOTS.MID), ...by('FWD', SLOTS.FWD)];
}

function randomXi(seed: string): Player[] {
  const rng = rngFromSeed(seed);
  const by = (pos: Position, n: number) =>
    [...allPlayers.filter((p) => p.pos === pos)].sort(() => rng() - 0.5).slice(0, n);
  return [...by('GK', SLOTS.GK), ...by('DEF', SLOTS.DEF), ...by('MID', SLOTS.MID), ...by('FWD', SLOTS.FWD)];
}

function boostedOpponents(boost: number): Opponent[] {
  return OPPONENTS.map((o) => ({ ...o, attack: o.attack + boost, defense: o.defense + boost }));
}

function stats(pts: number[]) {
  const s = [...pts].sort((a, b) => a - b);
  const q = (p: number) => s[Math.floor((s.length - 1) * p)];
  const hit = pts.filter((v) => v >= TARGET_POINTS).length;
  return {
    median: q(0.5),
    p90: q(0.9),
    max: s[s.length - 1],
    hit101: `${((hit / pts.length) * 100).toFixed(1)}%`,
  };
}

// global-optimal XI (best achievable across the whole era pool)
const optimal = pickBest(allPlayers);
const optS = teamStrength(optimal);
console.log(`Era pool: ${pool.length} eras, ${allPlayers.length} players`);
console.log(`Global-optimal XI strength: att ${optS.attack} def ${optS.defense}\n`);

const N = 600;
for (const boost of [0, 1, 2, 3]) {
  const opp = boostedOpponents(boost);
  const optPts = Array.from({ length: N }, (_, i) =>
    simulateSeason(optimal, { seed: `o-${i}`, opponents: opp }).points,
  );
  const rndPts = Array.from({ length: 250 }, (_, i) =>
    simulateSeason(randomXi(`r-${i}`), { seed: `rs-${i}`, opponents: opp }).points,
  );
  console.log(`boost +${boost}:`);
  console.log(`  optimal →`, stats(optPts));
  console.log(`  random  →`, stats(rndPts));
}
