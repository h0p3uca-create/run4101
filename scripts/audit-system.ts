// Audit the live game system end to end: roll weighting, star-player impact,
// balance (realistic playthroughs vs the optimal/random baselines) and
// scoreline realism. Read-only — touches no files.
//
// Run: npx tsx scripts/audit-system.ts
import {
  createRoll, roll, pick, canPick, isComplete, lineup, type RollState,
} from '../lib/engine/rollbuild';
import { simulateSeason } from '../lib/engine/simulate';
import { teamStrength } from '../lib/engine/ratings';
import { allTimeSources, type DrawSource } from '../lib/data/pool';
import { OPPONENTS } from '../lib/data/opponents';
import { getFormation } from '../lib/data/formations';
import { rngFromSeed } from '../lib/engine/rng';
import { TARGET_POINTS } from '../lib/engine/config';
import type { Player, Position } from '../lib/types';

const src = await allTimeSources();
const allPlayers = src.flatMap((s) => s.squad);

function pct(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const q = (p: number) => s[Math.floor((s.length - 1) * p)];
  const hit = xs.filter((v) => v >= TARGET_POINTS).length;
  return {
    median: q(0.5), p90: q(0.9), max: s[s.length - 1],
    hit101: `${((hit / xs.length) * 100).toFixed(1)}%`,
  };
}

// ── A realistic player: roll (weighted), pick best pickable, repeat ──────────
function buildGreedy(seed: string): Player[] {
  let s: RollState = createRoll({ seed, mode: 'main', formation: getFormation('4-3-3'), sources: src });
  let guard = 0;
  while (!isComplete(s) && guard++ < 400) {
    if (!s.drawn) { s = roll(s); continue; }
    const best = s.drawn.squad.filter((p) => canPick(s, p)).sort((a, b) => b.rating - a.rating)[0];
    s = best ? pick(s, best.id) : roll(s);
  }
  return lineup(s);
}
// A dedicated player: rolls past weak draws, only takes strong players for the
// position still needed (mimics hunting elites with the unlimited main-mode roll).
function buildSelective(seed: string): Player[] {
  let s: RollState = createRoll({ seed, mode: 'main', formation: getFormation('4-3-3'), sources: src });
  let guard = 0;
  while (!isComplete(s) && guard++ < 1200) {
    if (!s.drawn) { s = roll(s); continue; }
    const pickable = s.drawn.squad.filter((p) => canPick(s, p)).sort((a, b) => b.rating - a.rating);
    const bar = guard < 900 ? 84 : guard < 1100 ? 78 : 0; // relax the bar if running low on rolls
    const good = pickable.find((p) => p.rating >= bar);
    s = good ? pick(s, good.id) : roll(s);
  }
  return lineup(s);
}
function buildRandom(seed: string): Player[] {
  const rng = rngFromSeed(`pick|${seed}`);
  let s: RollState = createRoll({ seed, mode: 'main', formation: getFormation('4-3-3'), sources: src });
  let guard = 0;
  while (!isComplete(s) && guard++ < 400) {
    if (!s.drawn) { s = roll(s); continue; }
    const ok = s.drawn.squad.filter((p) => canPick(s, p));
    s = ok.length ? pick(s, ok[Math.floor(rng() * ok.length)].id) : roll(s);
  }
  return lineup(s);
}
function optimalXi(): Player[] {
  const SLOTS = getFormation('4-3-3').slots;
  const key = (p: Player) => (p.pos === 'GK' || p.pos === 'DEF' ? p.def * 0.6 + p.att * 0.4 : p.att * 0.7 + p.def * 0.3);
  const by = (pos: Position, n: number) => allPlayers.filter((p) => p.pos === pos).sort((a, b) => key(b) - key(a)).slice(0, n);
  return [...by('GK', SLOTS.GK), ...by('DEF', SLOTS.DEF), ...by('MID', SLOTS.MID), ...by('FWD', SLOTS.FWD)];
}

console.log('━━━ RUNFOR101 SYSTEM AUDIT ━━━\n');

// 1) ROLL WEIGHTING ----------------------------------------------------------
{
  const byStr = [...src].sort((a, b) => (a.strength ?? 0) - (b.strength ?? 0));
  const top = new Set(byStr.slice(Math.floor(byStr.length * 2 / 3)).map((s) => s.key));
  const bot = new Set(byStr.slice(0, Math.floor(byStr.length / 3)).map((s) => s.key));
  let s = createRoll({ seed: 'audit-roll', mode: 'main', formation: getFormation('4-3-3'), sources: src });
  let t = 0, b = 0; const N = 5000;
  for (let i = 0; i < N; i++) { s = roll(s); const k = s.drawn!.key; if (top.has(k)) t++; else if (bot.has(k)) b++; }
  console.log('1) ROLL WEIGHTING (5000 draws)');
  console.log(`   strong third drawn: ${(t / N * 100).toFixed(1)}%   weak third: ${(b / N * 100).toFixed(1)}%   (uniform = 33/33)`);
  const dup = (() => { // cooldown: any repeat within 5 consecutive?
    let s2 = createRoll({ seed: 'cool', mode: 'main', formation: getFormation('4-3-3'), sources: src });
    const keys: string[] = [];
    for (let i = 0; i < 60; i++) { s2 = roll(s2); keys.push(s2.drawn!.key); }
    for (let i = 0; i + 5 <= keys.length; i++) if (new Set(keys.slice(i, i + 5)).size !== 5) return true;
    return false;
  })();
  console.log(`   cooldown intact (no repeat within 5 draws): ${!dup ? 'OK' : 'FAIL'}\n`);
}

// 2) STAR IMPACT -------------------------------------------------------------
{
  const mk = (pos: Player['pos'], att: number, def: number, i: number): Player => ({ id: `p${i}`, name: 'x', pos, att, def, rating: Math.max(att, def) });
  const flat: Player[] = [mk('GK', 10, 82, 0), mk('DEF', 40, 80, 1), mk('DEF', 40, 80, 2), mk('DEF', 40, 80, 3), mk('DEF', 40, 80, 4), mk('MID', 75, 70, 5), mk('MID', 75, 70, 6), mk('MID', 75, 70, 7), mk('FWD', 78, 35, 8), mk('FWD', 78, 35, 9), mk('FWD', 78, 35, 10)];
  const star = flat.map((p, i) => (i === 8 ? mk('FWD', 92, 35, 8) : i === 5 ? mk('MID', 90, 70, 5) : p));
  const a = teamStrength(flat), bb = teamStrength(star);
  console.log('2) STAR IMPACT (same XI, swap two mids/fwds for a 90/92)');
  console.log(`   flat squad  → attack ${a.attack}  defense ${a.defense}`);
  console.log(`   with stars  → attack ${bb.attack}  defense ${bb.defense}   (+${(bb.attack - a.attack).toFixed(1)} attack)\n`);
}

// 3) BALANCE: realistic playthroughs vs baselines ----------------------------
{
  const N = 400;
  const opt = optimalXi(); const optS = teamStrength(opt);
  const optPts = Array.from({ length: N }, (_, i) => simulateSeason(opt, { seed: `o${i}`, opponents: OPPONENTS }).points);
  const selPts: number[] = []; const selStr: number[] = [];
  const greedyPts: number[] = []; const randPts: number[] = [];
  for (let i = 0; i < N; i++) {
    const sel = buildSelective(`sel-${i}`); selStr.push(teamStrength(sel).attack);
    selPts.push(simulateSeason(sel, { seed: `ss${i}`, opponents: OPPONENTS }).points);
    const g = buildGreedy(`g-${i}`);
    greedyPts.push(simulateSeason(g, { seed: `gs${i}`, opponents: OPPONENTS }).points);
    const r = buildRandom(`r-${i}`); randPts.push(simulateSeason(r, { seed: `rs${i}`, opponents: OPPONENTS }).points);
  }
  console.log('3) BALANCE — main mode 4-3-3, vs generic opponents');
  console.log(`   optimal XI   (att ${optS.attack}/def ${optS.defense}) →`, pct(optPts));
  console.log(`   selective    (hunts elites, att ${(selStr.reduce((a, b) => a + b, 0) / selStr.length).toFixed(0)}) →`, pct(selPts));
  console.log(`   greedy build (takes best each roll)         →`, pct(greedyPts));
  console.log(`   random build (casual)                      →`, pct(randPts), '\n');
}

// 4) SCORELINE REALISM -------------------------------------------------------
{
  const xi = buildGreedy('realism');
  let gf = 0, ga = 0, w = 0, d = 0, l = 0, cs = 0, games = 0; const scores = new Map<string, number>();
  for (let i = 0; i < 200; i++) {
    const r = simulateSeason(xi, { seed: `re${i}`, opponents: OPPONENTS });
    for (const m of r.matches) {
      gf += m.goalsFor; ga += m.goalsAgainst; games++;
      if (m.outcome === 'W') w++; else if (m.outcome === 'D') d++; else l++;
      if (m.goalsAgainst === 0) cs++;
      const k = `${Math.min(m.goalsFor, 5)}-${Math.min(m.goalsAgainst, 5)}`;
      scores.set(k, (scores.get(k) ?? 0) + 1);
    }
  }
  let blowouts = 0; for (const [k, n] of scores) if (Number(k.split('-')[0]) >= 4) blowouts += n;
  const top = [...scores.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => `${k} (${(n / games * 100).toFixed(0)}%)`);
  console.log('4) SCORELINE REALISM (greedy XI, 200 seasons)   [real PL ≈ 2.8 g/game, ~25% draws]');
  console.log(`   goals/game: for ${(gf / games).toFixed(2)}  against ${(ga / games).toFixed(2)}  total ${((gf + ga) / games).toFixed(2)}`);
  console.log(`   W/D/L: ${(w / games * 100).toFixed(0)}% / ${(d / games * 100).toFixed(0)}% / ${(l / games * 100).toFixed(0)}%   clean sheets: ${(cs / games * 100).toFixed(0)}%`);
  console.log(`   you score 4+ in ${(blowouts / games * 100).toFixed(0)}% of games (blowout rate)`);
  console.log(`   common scorelines: ${top.join(', ')}\n`);
}

// 5) FORMATIONS + CHALLENGE smoke -------------------------------------------
{
  console.log('5) FORMATION / MODE smoke (greedy completes + points sane)');
  for (const f of ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2']) {
    let s: RollState = createRoll({ seed: `f-${f}`, mode: 'main', formation: getFormation(f), sources: src });
    let guard = 0;
    while (!isComplete(s) && guard++ < 400) {
      if (!s.drawn) { s = roll(s); continue; }
      const best = s.drawn.squad.filter((p) => canPick(s, p)).sort((a, b) => b.rating - a.rating)[0];
      s = best ? pick(s, best.id) : roll(s);
    }
    const ok = isComplete(s);
    const p = ok ? simulateSeason(lineup(s), { seed: 'fs', opponents: OPPONENTS }).points : -1;
    console.log(`   ${f}: ${ok ? 'complete' : 'INCOMPLETE'}  points ${p}`);
  }
}

console.log('\n━━━ AUDIT COMPLETE ━━━');
