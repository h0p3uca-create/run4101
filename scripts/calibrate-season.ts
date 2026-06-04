// Confirm 101 is reachable-but-rare in SEASON mode (real opponents are tougher
// than the generic league). Builds an optimal & a random XI for each season and
// reports the points distribution vs that season's real clubs.
//
// Run: npx tsx scripts/calibrate-season.ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { seasonPool, seasonOpponents, SEASONS_INDEX } from '../lib/data/seasons';
import { simulateSeason } from '../lib/engine/simulate';
import { teamStrength } from '../lib/engine/ratings';
import { getFormation } from '../lib/data/formations';
import { rngFromSeed } from '../lib/engine/rng';
import { TARGET_POINTS } from '../lib/engine/config';
import type { Player, Position, Season } from '../lib/types';

// Read season JSON directly (the app loader is async/dynamic; scripts read sync).
function getSeason(id: string): Season {
  return JSON.parse(readFileSync(join('lib', 'data', 'seasons', `${id}.json`), 'utf-8')) as Season;
}

const SLOTS = getFormation('4-3-3').slots;

function pickBest(pool: Player[], key: (p: Player) => number): Player[] {
  const by = (pos: Position, n: number) =>
    pool.filter((p) => p.pos === pos).sort((a, b) => key(b) - key(a)).slice(0, n);
  return [
    ...by('GK', SLOTS.GK), ...by('DEF', SLOTS.DEF),
    ...by('MID', SLOTS.MID), ...by('FWD', SLOTS.FWD),
  ];
}

function randomXi(pool: Player[], seed: string): Player[] {
  const rng = rngFromSeed(seed);
  const by = (pos: Position, n: number) =>
    [...pool.filter((p) => p.pos === pos)].sort(() => rng() - 0.5).slice(0, n);
  return [
    ...by('GK', SLOTS.GK), ...by('DEF', SLOTS.DEF),
    ...by('MID', SLOTS.MID), ...by('FWD', SLOTS.FWD),
  ];
}

function stats(pts: number[]) {
  const s = [...pts].sort((a, b) => a - b);
  const q = (p: number) => s[Math.floor((s.length - 1) * p)];
  const hit = pts.filter((v) => v >= TARGET_POINTS).length;
  return {
    median: q(0.5),
    mean: +(s.reduce((a, b) => a + b, 0) / s.length).toFixed(1),
    p90: q(0.9), max: s[s.length - 1],
    hit101: `${((hit / pts.length) * 100).toFixed(1)}%`,
  };
}

const N = 400;
for (const meta of SEASONS_INDEX) {
  const season = getSeason(meta.id);
  const pool = seasonPool(season);
  const opp = seasonOpponents(season);
  // optimal: maximise position-appropriate strength
  const optimal = pickBest(pool, (p) =>
    p.pos === 'GK' || p.pos === 'DEF' ? p.def * 0.6 + p.att * 0.4 : p.att * 0.7 + p.def * 0.3,
  );
  const optS = teamStrength(optimal);
  const optPts = Array.from({ length: N }, (_, i) =>
    simulateSeason(optimal, { seed: `s-${i}`, opponents: opp }).points,
  );
  const rndPts = Array.from({ length: 150 }, (_, i) => {
    const xi = randomXi(pool, `r-${meta.id}-${i}`);
    return simulateSeason(xi, { seed: `rs-${i}`, opponents: opp }).points;
  });
  console.log(`\n■ ${meta.label}  (champion ${meta.winnerPts})`);
  console.log(`  optimal XI  str att${optS.attack} def${optS.defense}  →`, stats(optPts));
  console.log(`  random XI                          →`, stats(rndPts));
}
