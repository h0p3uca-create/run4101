// Monte-Carlo calibration: simulate many seasons across XIs of varying quality
// and report the points distribution. Goal curve:
//   random/auto-drafted XI  → ~55-70
//   strong hand-picked XI   → ~85-95
//   elite XI (+ luck)       → can touch 100-105, but 101 stays rare
//
// Run: npm run calibrate
import { PLAYERS, PLAYERS_BY_ID } from '../lib/data/players';
import { simulateSeason, teamStrength } from '../lib/engine';
import { createDraft, autoDraft, getUserXi } from '../lib/engine/draft';
import { TARGET_POINTS } from '../lib/engine/config';
import { getFormation } from '../lib/data/formations';
import { rngFromSeed } from '../lib/engine/rng';
import type { Player, Position } from '../lib/types';

// A "casual / unlucky" XI: fill a 4-3-3 with random legal players (not greedy).
function randomXi(seed: string): Player[] {
  const rng = rngFromSeed(`rand|${seed}`);
  const slots = getFormation('4-3-3').slots;
  const xi: Player[] = [];
  for (const pos of ['GK', 'DEF', 'MID', 'FWD'] as Position[]) {
    const group = PLAYERS.filter((p) => p.pos === pos);
    const shuffled = [...group].sort(() => rng() - 0.5);
    xi.push(...shuffled.slice(0, slots[pos]));
  }
  return xi;
}

function stats(points: number[]) {
  const sorted = [...points].sort((a, b) => a - b);
  const sum = sorted.reduce((s, v) => s + v, 0);
  const q = (p: number) => sorted[Math.floor((sorted.length - 1) * p)];
  const hit = points.filter((v) => v >= TARGET_POINTS).length;
  return {
    n: points.length,
    min: sorted[0],
    p10: q(0.1),
    median: q(0.5),
    mean: +(sum / sorted.length).toFixed(1),
    p90: q(0.9),
    max: sorted[sorted.length - 1],
    hit101: `${((hit / points.length) * 100).toFixed(1)}%`,
  };
}

function manySeasons(xi: Player[], n: number): number[] {
  return Array.from({ length: n }, (_, i) =>
    simulateSeason(xi, { seed: `cal-${i}` }).points,
  );
}

const ELITE = [
  'gk-schmeichel', 'df-vandijk', 'df-ferdinand', 'df-terry', 'df-taa',
  'mf-debruyne', 'mf-gerrard', 'mf-silva', 'fw-henry', 'fw-shearer', 'fw-aguero',
].map((id) => PLAYERS_BY_ID[id]);

const STRONG = [
  'gk-cech', 'df-kompany', 'df-vidic', 'df-carragher', 'df-robertson',
  'mf-lampard', 'mf-yaya', 'mf-fabregas', 'fw-rooney', 'fw-drogba', 'fw-salah',
].map((id) => PLAYERS_BY_ID[id]);

// 200 auto-drafted "what a casual roll produces" XIs
const autoXis: Player[][] = Array.from({ length: 200 }, (_, i) =>
  getUserXi(autoDraft(createDraft({ seed: `auto-${i}`, userFormationId: '4-3-3' }))),
);

const N = 400;
const eliteS = teamStrength(ELITE);
const strongS = teamStrength(STRONG);

console.log('── Gofor101 calibration ──');
console.log(`TARGET = ${TARGET_POINTS} pts · ${N} seasons per XI\n`);
console.log('ELITE   strength', eliteS, '\n ', stats(manySeasons(ELITE, N)));
console.log('STRONG  strength', strongS, '\n ', stats(manySeasons(STRONG, N)));

// one season each for 200 auto-drafted XIs → distribution of "typical" rolls
const autoPoints = autoXis.map(
  (xi, i) => simulateSeason(xi, { seed: `auto-season-${i}` }).points,
);
console.log('\nAUTO-DRAFT (200 distinct XIs, 1 season each)\n ', stats(autoPoints));

// RANDOM (casual/unlucky) baseline: 200 random XIs, 1 season each
const randomXis = Array.from({ length: 200 }, (_, i) => randomXi(`r-${i}`));
const randomPoints = randomXis.map(
  (xi, i) => simulateSeason(xi, { seed: `rand-season-${i}` }).points,
);
const rs = randomXis.map(teamStrength);
const rAtt = (rs.reduce((s, x) => s + x.attack, 0) / rs.length).toFixed(1);
const rDef = (rs.reduce((s, x) => s + x.defense, 0) / rs.length).toFixed(1);
console.log('\nRANDOM XI (200 casual rolls, 1 season each)\n ', stats(randomPoints));
console.log(`  avg random strength: att ${rAtt} def ${rDef}`);

const autoStrengths = autoXis.map(teamStrength);
const avgAtt = (autoStrengths.reduce((s, x) => s + x.attack, 0) / autoStrengths.length).toFixed(1);
const avgDef = (autoStrengths.reduce((s, x) => s + x.defense, 0) / autoStrengths.length).toFixed(1);
console.log(`  avg auto-draft strength: att ${avgAtt} def ${avgDef}`);
