// Build the missing recent seasons (2023-24, 2024-25, 2025-26) that the FIFA
// source data didn't cover. Squads + final tables are curated from football
// knowledge on the SAME 0–99 scale as the rest of the dataset (elite carry-over
// players keep their override ratings). 2025-26 is PROJECTED (post-cutoff): a
// plausible table + carried-forward/aged squads, flagged `estimated`.
//
// Run: npx tsx scripts/ingest/build-recent.ts  (then wire into index + pool)
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Player, Position, Season, SeasonClub } from '../../lib/types';
import type { P, Row } from './recent/types';

const DIR = join('lib', 'data', 'seasons');

const clamp = (n: number) => Math.max(8, Math.min(99, Math.round(n)));
const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

// Derive att/def from rating + role, matching the existing data's archetypes.
function attDef(pos: Position, rating: number, code: string): { att: number; def: number } {
  const c = code.split(',')[0];
  if (pos === 'GK') return { att: 14, def: rating };
  if (pos === 'DEF') {
    if (c === 'LB' || c === 'RB' || c === 'LWB' || c === 'RWB')
      return { att: clamp(rating - 12), def: clamp(rating - 2) };
    return { att: clamp(rating - 42), def: rating }; // CB
  }
  if (pos === 'MID') {
    if (c === 'CDM') return { att: clamp(rating - 14), def: clamp(rating - 4) };
    if (c === 'CAM') return { att: rating, def: clamp(rating - 26) };
    if (c === 'LW' || c === 'RW' || c === 'LM' || c === 'RM')
      return { att: rating, def: clamp(rating - 32) };
    return { att: clamp(rating - 7), def: clamp(rating - 10) }; // CM
  }
  // FWD
  if (c === 'LW' || c === 'RW') return { att: rating, def: clamp(rating - 38) };
  return { att: rating, def: 35 }; // ST/CF
}

function mkSquad(clubId: string, list: P[]): Player[] {
  return list.map(([name, pos, rating, code]) => {
    const codes = (code ?? defaultCode(pos)).split(',');
    const { att, def } = attDef(pos, rating, codes[0]);
    return {
      id: `${clubId}-${slug(name)}`,
      name,
      pos,
      positions: codes,
      att,
      def,
      rating,
    };
  });
}
const defaultCode = (pos: Position) => (pos === 'GK' ? 'GK' : pos === 'DEF' ? 'CB' : pos === 'MID' ? 'CM' : 'ST');

// team attack/defense (same shape as build-seasons): best-XI-ish weighted means
function teamAxes(squad: Player[]): { attack: number; defense: number } {
  const top = (p: Position, key: 'att' | 'def', n: number) =>
    squad.filter((x) => x.pos === p).sort((a, b) => b[key] - a[key]).slice(0, n);
  const mean = (xs: Player[], key: 'att' | 'def') => (xs.length ? xs.reduce((s, x) => s + x[key], 0) / xs.length : 0);
  const attack = 0.5 * mean(top('FWD', 'att', 3), 'att') + 0.35 * mean(top('MID', 'att', 3), 'att') + 0.15 * mean(top('DEF', 'att', 4), 'att');
  const defense = 0.3 * mean(top('GK', 'def', 1), 'def') + 0.45 * mean(top('DEF', 'def', 4), 'def') + 0.25 * mean(top('MID', 'def', 3), 'def');
  return { attack: Math.round(attack), defense: Math.round(defense) };
}

const tier = (pos: number): SeasonClub['tier'] =>
  pos < 4 ? 'title' : pos < 7 ? 'europe' : pos < 17 ? 'mid' : 'relegation';

function buildSeason(id: string, label: string, winnerPts: number, rows: Row[], estimated = false): Season {
  const clubs: SeasonClub[] = rows.map((r, i) => {
    const squad = mkSquad(r.id, r.squad);
    const axes = teamAxes(squad);
    return {
      id: r.id, name: r.name, pos: i + 1, pts: r.pts, gf: r.gf, ga: r.ga,
      tier: tier(i + 1), attack: axes.attack, defense: axes.defense, squad,
    };
  });
  return { id, label, winnerPts, ...(estimated ? { estimated: true } : {}), clubs };
}

// ── season data is imported from sibling files to keep this readable ──────────
import { S2023 } from './recent/s2023';
import { S2024 } from './recent/s2024';
import { S2025 } from './recent/s2025';

const seasons = [
  buildSeason('2023-24', 'Premier League 2023-24', 91, S2023),
  buildSeason('2024-25', 'Premier League 2024-25', 84, S2024),
  buildSeason('2025-26', 'Premier League 2025-26', 84, S2025, true),
];

for (const s of seasons) {
  writeFileSync(join(DIR, `${s.id}.json`), JSON.stringify(s));
  const players = s.clubs.reduce((n, c) => n + c.squad.length, 0);
  console.log(`✓ ${s.id}: ${s.clubs.length} clubs, ${players} players${s.estimated ? ' (estimated)' : ''}`);
}

// keep the index in sync (append the three, sorted)
const index = JSON.parse(readFileSync(join(DIR, 'index.json'), 'utf-8')) as { id: string }[];
const have = new Set(index.map((m) => m.id));
const add = seasons.filter((s) => !have.has(s.id)).map((s) => ({
  id: s.id, label: s.label, clubs: s.clubs.length,
  players: s.clubs.reduce((n, c) => n + c.squad.length, 0),
  winnerPts: s.winnerPts, ...(s.estimated ? { estimated: true } : {}),
}));
if (add.length) {
  const merged = [...index, ...add].sort((a, b) => a.id.localeCompare(b.id));
  writeFileSync(join(DIR, 'index.json'), JSON.stringify(merged, null, 2) + '\n');
  console.log(`✓ index.json: +${add.length} seasons (now ${merged.length})`);
}
export {};
