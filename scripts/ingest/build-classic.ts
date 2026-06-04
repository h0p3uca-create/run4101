// ─────────────────────────────────────────────────────────────
// Build "classic" PL seasons 2007-08 → 2013-14 (pre-FIFA-data years).
//
//   Squads + positions + appearances/goals: Transfermarkt "football-datasets"
//     (salimt/football-datasets, CC0 facts) — player_performances + profiles.
//   Results / finish / champion pts: openfootball/england (CC0).
//
// Real FIFA ratings don't exist this far back, so ratings are SYNTHESISED from
// objective signals (appearances, goals/assists, league finish) — clearly
// flagged "estimated" in-game. Positions come from Transfermarkt main_position.
//
// Run: npx tsx scripts/ingest/build-classic.ts  (uses cached CSVs)
// ─────────────────────────────────────────────────────────────
import { createReadStream, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { join } from 'node:path';
import { codeGroup } from '../../lib/data/formations';
import type { Position } from '../../lib/types';

const CACHE = join('scripts', 'ingest', '.cache');
const OUT = join('lib', 'data', 'seasons');
const PERF = join(CACHE, 'tm_perf.csv');
const PROFILES = join(CACHE, 'tm_profiles.csv');
const OF_RAW = 'https://raw.githubusercontent.com/openfootball/england/master';

// season_name "07/08" → id "2007-08"
const TARGET = ['07/08', '08/09', '09/10', '10/11', '11/12', '12/13', '13/14'];
const LABELS: Record<string, string> = {
  '2008-09': '2008/09 · estimated',
  '2009-10': '2009/10 · estimated',
  '2010-11': '2010/11 · estimated',
  '2011-12': '2011/12 · Aguerooo · est.',
  '2012-13': '2012/13 · Fergie’s last · est.',
  '2013-14': '2013/14 · estimated',
  '2007-08': '2007/08 · Ronaldo · est.',
};
function seasonId(sn: string): string {
  const [a] = sn.split('/');
  return `${2000 + Number(a)}-${sn.split('/')[1]}`;
}

function splitCsv(line: string): string[] {
  const out: string[] = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') q = !q;
    else if (c === ',' && !q) { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur); return out;
}
const numOf = (v: string) => { const m = /-?\d+(\.\d+)?/.exec(v || ''); return m ? Math.round(+m[0]) : 0; };

// ── Transfermarkt main_position → FIFA code ───────────────────
const POS_MAP: Record<string, string> = {
  'goalkeeper': 'GK',
  'centre-back': 'CB', 'left-back': 'LB', 'right-back': 'RB',
  'defensive midfield': 'CDM', 'central midfield': 'CM', 'attacking midfield': 'CAM',
  'left midfield': 'LM', 'right midfield': 'RM',
  'left winger': 'LW', 'right winger': 'RW',
  'second striker': 'CF', 'centre-forward': 'ST', 'forward': 'ST',
  'defender': 'CB', 'midfield': 'CM', 'midfielder': 'CM', 'attack': 'ST', 'striker': 'ST',
};
function mapPos(main: string, coarse: string): string {
  return POS_MAP[(main || '').trim().toLowerCase()] ?? POS_MAP[(coarse || '').trim().toLowerCase()] ?? 'CM';
}

function attDef(code: string, r: number): { att: number; def: number } {
  const g = codeGroup(code);
  const R = (f: number) => Math.round(r * f);
  if (g === 'GK') return { att: 12, def: r };
  if (g === 'DEF') return code === 'CB' ? { att: R(0.6), def: r } : { att: R(0.78), def: R(0.92) };
  if (g === 'MID') {
    if (code === 'CDM') return { att: R(0.72), def: R(0.9) };
    if (code === 'CAM') return { att: R(0.92), def: R(0.5) };
    if (code === 'LM' || code === 'RM') return { att: R(0.86), def: R(0.58) };
    return { att: R(0.82), def: R(0.74) }; // CM
  }
  if (code === 'CF') return { att: R(0.96), def: R(0.4) };
  if (code === 'LW' || code === 'RW') return { att: r, def: R(0.42) };
  return { att: r, def: R(0.38) }; // ST
}

// ── openfootball results → standings ──────────────────────────
const LINE = /^\s*(?:\d{1,2}[:.]\d{2}\s+)?(.+?)\s{2,}(\d+)-(\d+)(?:\s+\(\d+-\d+\))?\s{2,}(.+?)\s*$/;
interface ClubRow { club: string; gf: number; ga: number; pts: number; }
function standings(text: string): ClubRow[] {
  const t = new Map<string, ClubRow>();
  const get = (c: string) => t.get(c) ?? t.set(c, { club: c, gf: 0, ga: 0, pts: 0 }).get(c)!;
  for (const line of text.split('\n')) {
    const m = LINE.exec(line); if (!m) continue;
    const h = get(m[1].trim()), a = get(m[4].trim());
    const hg = +m[2], ag = +m[3];
    h.gf += hg; h.ga += ag; a.gf += ag; a.ga += hg;
    if (hg > ag) h.pts += 3; else if (hg < ag) a.pts += 3; else { h.pts++; a.pts++; }
  }
  return [...t.values()].sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf);
}
const normClub = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/\b(fc|afc|cf)\b/g, '').replace(/[^a-z]/g, '').trim();
type Tier = 'title' | 'europe' | 'mid' | 'relegation';
const tier = (p: number): Tier => (p < 4 ? 'title' : p < 7 ? 'europe' : p < 17 ? 'mid' : 'relegation');

interface PlayerSeason { id: string; name: string; pos: Position; positions: string[]; att: number; def: number; rating: number; }

const W_ATT = { FWD: 0.5, MID: 0.35, DEF: 0.15 };
const W_DEF = { GK: 0.3, DEF: 0.45, MID: 0.25 };
function squadStrength(squad: PlayerSeason[], nudge: number) {
  const top = (pos: Position, n: number, key: (p: PlayerSeason) => number) =>
    squad.filter((p) => p.pos === pos).sort((a, b) => key(b) - key(a)).slice(0, n);
  const xi = [...top('GK', 1, (p) => p.def), ...top('DEF', 4, (p) => p.def), ...top('MID', 3, (p) => p.rating), ...top('FWD', 3, (p) => p.att)];
  const mean = (pos: Position, k: 'att' | 'def') => { const gg = xi.filter((p) => p.pos === pos); return gg.length ? gg.reduce((s, p) => s + p[k], 0) / gg.length : 0; };
  const w = (parts: { v: number; w: number }[]) => { const a = parts.filter((p) => p.v > 0); const tw = a.reduce((s, p) => s + p.w, 0) || 1; return a.reduce((s, p) => s + p.v * p.w, 0) / tw; };
  const attack = w([{ v: mean('FWD', 'att'), w: W_ATT.FWD }, { v: mean('MID', 'att'), w: W_ATT.MID }, { v: mean('DEF', 'att'), w: W_ATT.DEF }]);
  const defense = w([{ v: mean('GK', 'def'), w: W_DEF.GK }, { v: mean('DEF', 'def'), w: W_DEF.DEF }, { v: mean('MID', 'def'), w: W_DEF.MID }]);
  const clamp = (x: number) => Math.max(42, Math.min(95, Math.round(x + nudge)));
  return { attack: clamp(attack), defense: clamp(defense) };
}

interface Stat { teamName: string; apps: number; goals: number; assists: number; minutes: number; }

async function main() {
  if (!existsSync(PERF) || !existsSync(PROFILES)) throw new Error('Run the download step first (tm_perf.csv / tm_profiles.csv missing)');

  // Pass 1: PL performances for target seasons → (season, teamId) → playerId → Stat
  const bySeason = new Map<string, Map<string, Map<string, Stat>>>();
  const neededIds = new Set<string>();
  {
    const rl = createInterface({ input: createReadStream(PERF), crlfDelay: Infinity });
    let idx: Record<string, number> = {}; let header = false;
    for await (const line of rl) {
      const c = splitCsv(line);
      if (!header) { c.forEach((h, i) => (idx[h] = i)); header = true; continue; }
      if (c[idx['competition_id']] !== 'GB1') continue;
      const sn = c[idx['season_name']];
      if (!TARGET.includes(sn)) continue;
      const apps = numOf(c[idx['nb_on_pitch']]);
      if (apps < 3) continue;
      const id = seasonId(sn);
      const teamId = c[idx['team_id']];
      const pid = c[idx['player_id']];
      neededIds.add(pid);
      if (!bySeason.has(id)) bySeason.set(id, new Map());
      const teams = bySeason.get(id)!;
      if (!teams.has(teamId)) teams.set(teamId, new Map());
      teams.get(teamId)!.set(pid, {
        teamName: c[idx['team_name']],
        apps, goals: numOf(c[idx['goals']]), assists: numOf(c[idx['assists']]), minutes: numOf(c[idx['minutes_played']]),
      });
    }
  }

  // Pass 2: profiles for needed players
  const profile = new Map<string, { name: string; pos: string }>();
  {
    const rl = createInterface({ input: createReadStream(PROFILES), crlfDelay: Infinity });
    let idx: Record<string, number> = {}; let header = false;
    for await (const line of rl) {
      const c = splitCsv(line);
      if (!header) { c.forEach((h, i) => (idx[h] = i)); header = true; continue; }
      const pid = c[idx['player_id']];
      if (!neededIds.has(pid)) continue;
      const rawName = c[idx['player_name']] || c[idx['name_in_home_country']] || 'Unknown';
      profile.set(pid, {
        name: rawName.replace(/\s*\(\d+\)\s*$/, '').trim() || 'Unknown',
        pos: mapPos(c[idx['main_position']] ?? '', c[idx['position']] ?? ''),
      });
    }
  }

  const index: { id: string; label: string; clubs: number; players: number; winnerPts: number; estimated: boolean }[] = [];

  for (const id of [...bySeason.keys()].sort()) {
    const ofText = await fetch(`${OF_RAW}/${id}/1-premierleague.txt`).then((r) => (r.ok ? r.text() : '')).catch(() => '');
    const table = standings(ofText);
    if (table.length < 18) { console.warn(`⚠ ${id}: ${table.length} clubs, skip`); continue; }

    // index perf teams by normalised name
    const teamSquads = new Map<string, PlayerSeason[]>(); // normName → players
    for (const [, players] of bySeason.get(id)!) {
      for (const [pid, st] of players) {
        const prof = profile.get(pid); if (!prof) continue;
        const code = prof.pos;
        const group = codeGroup(code);
        // synthesise rating (filled per club below using finish bonus → recompute there)
        const key = normClub(st.teamName);
        if (!teamSquads.has(key)) teamSquads.set(key, []);
        teamSquads.get(key)!.push({ id: `${id}-${key}-${normClub(prof.name)}`, name: prof.name, pos: group, positions: [code], att: 0, def: 0, rating: 0, _st: st } as PlayerSeason & { _st: Stat });
      }
    }

    const clubs = table.map((c, i) => {
      const pos = i + 1;
      const finishBonus = 15 - (pos - 1) * 1.0; // +15 .. -4
      const raw = (teamSquads.get(normClub(c.club)) ?? []) as (PlayerSeason & { _st: Stat })[];
      const squad: PlayerSeason[] = raw.map((p) => {
        const st = p._st;
        const starter = 15 * Math.min(1, st.apps / 38);
        const g = p.pos;
        const gc = g === 'FWD' ? Math.min(14, (st.goals + 0.5 * st.assists) * 1.1)
          : g === 'MID' ? Math.min(11, (st.goals + 0.6 * st.assists) * 1.1)
          : g === 'DEF' ? Math.min(6, (st.goals + st.assists) * 0.8) : 0;
        const rating = Math.max(46, Math.min(91, Math.round(50 + finishBonus + starter + gc)));
        const { att, def } = attDef(p.positions[0], rating);
        return { id: p.id, name: p.name, pos: p.pos, positions: p.positions, att, def, rating };
      }).sort((a, b) => b.rating - a.rating).slice(0, 24);

      const str = squadStrength(squad, (10.5 - pos) * 0.3);
      return { id: normClub(c.club), name: c.club, pos, pts: c.pts, gf: c.gf, ga: c.ga, tier: tier(i), attack: str.attack, defense: str.defense, squad };
    });

    const players = clubs.reduce((n, c) => n + c.squad.length, 0);
    const winnerPts = table[0].pts;
    const label = LABELS[id] ?? `${id.replace('-', '/')} · estimated`;
    writeFileSync(join(OUT, `${id}.json`), JSON.stringify({ id, label, winnerPts, estimated: true, clubs }));
    index.push({ id, label, clubs: clubs.length, players, winnerPts, estimated: true });
    const thin = clubs.filter((c) => c.squad.length < 11).map((c) => `${c.name}(${c.squad.length})`);
    console.log(`✓ ${id} ${label.padEnd(30)} ${clubs.length} clubs ${players} players champ ${winnerPts}${thin.length ? `  ⚠ thin: ${thin.join(',')}` : ''}`);
  }

  // merge into index.json (with existing FIFA seasons)
  const idxPath = join(OUT, 'index.json');
  const existing = existsSync(idxPath) ? JSON.parse(readFileSync(idxPath, 'utf-8')) as typeof index : [];
  const merged = [...existing.filter((e) => !index.some((n) => n.id === e.id)), ...index].sort((a, b) => a.id.localeCompare(b.id));
  writeFileSync(idxPath, JSON.stringify(merged, null, 2));
  console.log(`\n✓ ${index.length} classic seasons; index now ${merged.length} total`);
}

main().catch((e) => { console.error(e); process.exit(1); });
