// ─────────────────────────────────────────────────────────────
// Build real PL season datasets for Gofor101 from ONE consistent source.
//
//   Ratings + positions: stefanoleone "male_players (legacy)" (FIFA 15→23),
//     mirrored on Hugging Face (jsulz/FIFA23). One file, multi-position.
//   Results / champion pts / opponent strength: openfootball/england (CC0).
//
// Covers seasons 2014-15 → 2022-23 (fifa_version 15..23).
// Run: npx tsx scripts/ingest/build-seasons.ts   (downloads ~96MB once → .cache)
//
// Non-commercial fan project. No crests/marks. Ratings: CC BY-NC-SA. Results: CC0.
// ─────────────────────────────────────────────────────────────
import { mkdirSync, writeFileSync, existsSync, readFileSync, createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { join } from 'node:path';

const OF_RAW = 'https://raw.githubusercontent.com/openfootball/england/master';
const HF_URL =
  'https://huggingface.co/datasets/jsulz/FIFA23/resolve/main/male_players%20(legacy).csv';
const CACHE = join('scripts', 'ingest', '.cache');
const HF_FILE = join(CACHE, 'hf_legacy.csv');
const OUT = join('lib', 'data', 'seasons');

type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

// fifa_version → season id + label (nicknames for the iconic ones)
const SEASON_LABELS: Record<string, string> = {
  '2014-15': '2014/15',
  '2015-16': '2015/16 · The Miracle',
  '2016-17': '2016/17',
  '2017-18': '2017/18 · The Centurions',
  '2018-19': '2018/19 · 98 vs 97',
  '2019-20': '2019/20 · 30 Years',
  '2020-21': '2020/21',
  '2021-22': '2021/22 · 93:20',
  '2022-23': '2022/23 · The Treble',
};
function versionToSeason(v: string): { id: string; label: string } | null {
  const n = Number(v);
  if (n < 15 || n > 23) return null;
  const start = 2000 + n - 1;
  const id = `${start}-${String(n).padStart(2, '0')}`;
  return { id, label: SEASON_LABELS[id] ?? `${start}/${String(n).padStart(2, '0')}` };
}

// ── attribute groups (stefanoleone snake_case) ─────────────────
const ATT_BOOST = 6;
const ATT = [
  'attacking_finishing', 'power_shot_power', 'power_long_shots', 'mentality_positioning',
  'attacking_volleys', 'skill_dribbling', 'skill_ball_control', 'attacking_short_passing',
  'mentality_vision', 'attacking_crossing', 'movement_acceleration', 'movement_sprint_speed',
  'skill_curve', 'mentality_penalties',
];
const DEF = [
  'defending_marking_awareness', 'defending_standing_tackle', 'defending_sliding_tackle',
  'mentality_interceptions', 'attacking_heading_accuracy', 'power_strength',
  'mentality_aggression', 'power_jumping',
];
const GK = ['goalkeeping_reflexes', 'goalkeeping_diving', 'goalkeeping_handling', 'goalkeeping_positioning'];

const num = (v: string | undefined) => {
  if (!v) return 0;
  const m = /-?\d+/.exec(v);
  return m ? +m[0] : 0;
};
function avg(row: Record<string, string>, cols: string[]): number {
  const vals = cols.map((c) => num(row[c])).filter((v) => v > 0);
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
}

function posGroup(code: string): Position {
  const c = code.toUpperCase();
  if (c === 'GK') return 'GK';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(c)) return 'DEF';
  if (['CDM', 'CM', 'CAM', 'LM', 'RM', 'LDM', 'RDM'].includes(c)) return 'MID';
  return 'FWD'; // ST, CF, LW, RW, LF, RF, LS, RS …
}

// ── openfootball results → standings + squad-scaled strength ────
const LINE = /^\s*(?:\d{1,2}[:.]\d{2}\s+)?(.+?)\s{2,}(\d+)-(\d+)(?:\s+\(\d+-\d+\))?\s{2,}(.+?)\s*$/;
interface ClubRow { club: string; p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number; }

async function fetchText(url: string, cacheName: string): Promise<string> {
  mkdirSync(CACHE, { recursive: true });
  const path = join(CACHE, cacheName);
  if (existsSync(path)) return readFileSync(path, 'utf-8');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch ${res.status}: ${url}`);
  const text = await res.text();
  writeFileSync(path, text);
  return text;
}

function standings(text: string): ClubRow[] {
  const t = new Map<string, ClubRow>();
  const get = (c: string) => t.get(c) ?? t.set(c, { club: c, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }).get(c)!;
  for (const line of text.split('\n')) {
    const m = LINE.exec(line);
    if (!m) continue;
    const h = get(m[1].trim()), a = get(m[4].trim());
    const hg = +m[2], ag = +m[3];
    h.p++; a.p++; h.gf += hg; h.ga += ag; a.gf += ag; a.ga += hg;
    if (hg > ag) { h.w++; h.pts += 3; a.l++; }
    else if (hg < ag) { a.w++; a.pts += 3; h.l++; }
    else { h.d++; a.d++; h.pts++; a.pts++; }
  }
  return [...t.values()].sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf);
}

function normClub(name: string): string {
  return name.toLowerCase().replace(/&/g, 'and').replace(/\b(fc|afc|cf)\b/g, '').replace(/[^a-z]/g, '').trim();
}
function tier(pos: number): ClubRow['club'] extends never ? never : 'title' | 'europe' | 'mid' | 'relegation' {
  return (pos < 4 ? 'title' : pos < 7 ? 'europe' : pos < 17 ? 'mid' : 'relegation') as never;
}

interface PlayerSeason { id: string; name: string; pos: Position; positions: string[]; att: number; def: number; rating: number; }

// squad → attack/defense on the engine scale (best XI, weighted)
const W_ATT = { FWD: 0.5, MID: 0.35, DEF: 0.15 };
const W_DEF = { GK: 0.3, DEF: 0.45, MID: 0.25 };
function squadStrength(squad: PlayerSeason[], nudge: number) {
  const top = (pos: Position, n: number, key: (p: PlayerSeason) => number) =>
    squad.filter((p) => p.pos === pos).sort((a, b) => key(b) - key(a)).slice(0, n);
  const xi = [...top('GK', 1, (p) => p.def), ...top('DEF', 4, (p) => p.def), ...top('MID', 3, (p) => p.rating), ...top('FWD', 3, (p) => p.att)];
  const meanBy = (pos: Position, k: 'att' | 'def') => {
    const g = xi.filter((p) => p.pos === pos);
    return g.length ? g.reduce((s, p) => s + p[k], 0) / g.length : 0;
  };
  const w = (parts: { v: number; w: number }[]) => {
    const a = parts.filter((p) => p.v > 0); const tw = a.reduce((s, p) => s + p.w, 0) || 1;
    return a.reduce((s, p) => s + p.v * p.w, 0) / tw;
  };
  const attack = w([{ v: meanBy('FWD', 'att'), w: W_ATT.FWD }, { v: meanBy('MID', 'att'), w: W_ATT.MID }, { v: meanBy('DEF', 'att'), w: W_ATT.DEF }]);
  const defense = w([{ v: meanBy('GK', 'def'), w: W_DEF.GK }, { v: meanBy('DEF', 'def'), w: W_DEF.DEF }, { v: meanBy('MID', 'def'), w: W_DEF.MID }]);
  const clamp = (x: number) => Math.max(42, Math.min(95, Math.round(x + nudge)));
  return { attack: clamp(attack), defense: clamp(defense) };
}

// ── stream the big HF CSV once → { version → club_norm → players } ──
async function loadFifa(): Promise<Map<string, Map<string, PlayerSeason[]>>> {
  if (!existsSync(HF_FILE)) {
    process.stdout.write('Downloading FIFA dataset (~96MB)… ');
    const res = await fetch(HF_URL);
    if (!res.ok) throw new Error(`HF fetch ${res.status}`);
    writeFileSync(HF_FILE, Buffer.from(await res.arrayBuffer()));
    console.log('done');
  }
  const byVer = new Map<string, Map<string, PlayerSeason[]>>();
  const rl = createInterface({ input: createReadStream(HF_FILE), crlfDelay: Infinity });
  let header: string[] | null = null;
  let idx: Record<string, number> = {};
  for await (const line of rl) {
    const cells = splitCsv(line);
    if (!header) {
      header = cells;
      header.forEach((h, i) => (idx[h] = i));
      continue;
    }
    const get = (k: string) => cells[idx[k]] ?? '';
    if (get('league_name') !== 'Premier League') continue;
    const ver = get('fifa_version');
    if (!versionToSeason(ver)) continue;
    const rawPos = get('player_positions').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
    if (rawPos.length === 0) continue;
    const primary = rawPos[0];
    const group = posGroup(primary);
    const overall = num(get('overall'));
    if (overall < 40) continue;
    const isGk = group === 'GK';
    const row: Record<string, string> = {};
    for (const k in idx) row[k] = cells[idx[k]] ?? '';
    const att = isGk ? 12 : Math.min(99, avg(row, ATT) + ATT_BOOST);
    const def = isGk ? Math.max(avg(row, GK), overall) : avg(row, DEF);
    const name = get('short_name') || get('long_name');
    const club = get('club_name');
    const ps: PlayerSeason = {
      id: `${ver}-${normClub(club)}-${normClub(name)}`,
      name, pos: group, positions: [...new Set(rawPos)],
      att: att || overall, def: def || Math.round(overall * 0.6), rating: overall,
    };
    if (!byVer.has(ver)) byVer.set(ver, new Map());
    const clubs = byVer.get(ver)!;
    const key = normClub(club);
    if (!clubs.has(key)) clubs.set(key, []);
    clubs.get(key)!.push(ps);
  }
  return byVer;
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

// ── Performance override: lift FIFA (pre-season snapshot) ratings toward what a
// player actually did that season, using real PL goals/assists/apps from the
// Transfermarkt files. Fixes breakout seasons (e.g. Vardy/Mahrez 2015-16). ────
const PERF = join(CACHE, 'tm_perf.csv');
const PROFILES = join(CACHE, 'tm_profiles.csv');
const FIFA_SN = ['14/15', '15/16', '16/17', '17/18', '18/19', '19/20', '20/21', '21/22', '22/23'];

function nameKey(name: string): string {
  const n = name.replace(/\s*\(\d+\)\s*$/, '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const toks = n.split(/[\s.]+/).filter(Boolean);
  if (!toks.length) return '';
  const initial = toks[0][0];
  const last = toks.length > 1 ? toks.slice(1).join('') : toks[0];
  return `${initial}|${last}`.replace(/[^a-z|]/g, '');
}

interface PerfStat { apps: number; goals: number; assists: number; }
type PerfMap = Map<string, PerfStat>;

async function loadPerf(): Promise<PerfMap> {
  const map: PerfMap = new Map();
  if (!existsSync(PERF) || !existsSync(PROFILES)) {
    console.warn('  ⚠ perf/profiles missing — no performance override');
    return map;
  }
  const rows: { id: string; pid: string; club: string; st: PerfStat }[] = [];
  const ids = new Set<string>();
  {
    const rl = createInterface({ input: createReadStream(PERF), crlfDelay: Infinity });
    let idx: Record<string, number> = {}; let header = false;
    for await (const line of rl) {
      const c = splitCsv(line);
      if (!header) { c.forEach((h, i) => (idx[h] = i)); header = true; continue; }
      if (c[idx['competition_id']] !== 'GB1') continue;
      const sn = c[idx['season_name']];
      if (!FIFA_SN.includes(sn)) continue;
      const apps = num(c[idx['nb_on_pitch']]);
      if (apps < 1) continue;
      rows.push({
        id: `${2000 + Number(sn.split('/')[0])}-${sn.split('/')[1]}`,
        pid: c[idx['player_id']],
        club: normClub(c[idx['team_name']]),
        st: { apps, goals: num(c[idx['goals']]), assists: num(c[idx['assists']]) },
      });
      ids.add(c[idx['player_id']]);
    }
  }
  const names = new Map<string, string>();
  {
    const rl = createInterface({ input: createReadStream(PROFILES), crlfDelay: Infinity });
    let idx: Record<string, number> = {}; let header = false;
    for await (const line of rl) {
      const c = splitCsv(line);
      if (!header) { c.forEach((h, i) => (idx[h] = i)); header = true; continue; }
      const pid = c[idx['player_id']];
      if (ids.has(pid)) names.set(pid, c[idx['player_name']] || '');
    }
  }
  for (const r of rows) {
    const nm = names.get(r.pid); if (!nm) continue;
    map.set(`${r.id}|${r.club}|${nameKey(nm)}`, r.st);
  }
  return map;
}

function applyPerfBonus(p: PlayerSeason, perf: PerfMap, seasonId: string, ck: string, finishBonus: number): PlayerSeason {
  const st = perf.get(`${seasonId}|${ck}|${nameKey(p.name)}`);
  if (!st) return p;
  const starter = 15 * Math.min(1, st.apps / 38);
  const gc = p.pos === 'FWD' ? Math.min(14, (st.goals + 0.5 * st.assists) * 1.1)
    : p.pos === 'MID' ? Math.min(11, (st.goals + 0.6 * st.assists) * 1.1)
    : p.pos === 'DEF' ? Math.min(6, (st.goals + st.assists) * 0.8) : 0;
  const form = 50 + finishBonus + starter + gc;
  const bonus = Math.max(0, Math.min(9, Math.round((form - p.rating) * 0.6)));
  if (bonus === 0) return p;
  const att = p.pos === 'FWD' ? Math.min(99, p.att + bonus) : p.pos === 'MID' ? Math.min(99, p.att + Math.round(bonus * 0.5)) : p.att;
  const def = p.pos === 'GK' || p.pos === 'DEF' ? Math.min(99, p.def + bonus) : p.pos === 'MID' ? Math.min(99, p.def + Math.round(bonus * 0.5)) : p.def;
  return { ...p, rating: Math.min(99, p.rating + bonus), att, def };
}

async function build() {
  mkdirSync(OUT, { recursive: true });
  const fifa = await loadFifa();
  const perf = await loadPerf();
  const index: { id: string; label: string; clubs: number; players: number; winnerPts: number }[] = [];

  for (const ver of [...fifa.keys()].sort()) {
    const season = versionToSeason(ver)!;
    const ofText = await fetchText(`${OF_RAW}/${season.id}/1-premierleague.txt`, `of-${season.id}.txt`).catch(() => '');
    const table = standings(ofText);
    if (table.length < 18) { console.warn(`⚠ ${season.id}: ${table.length} clubs, skip`); continue; }
    const squadByClub = fifa.get(ver)!;

    const clubs = table.map((c, i) => {
      const ck = normClub(c.club);
      const finishBonus = 15 - i * 1.0;
      const squad = (squadByClub.get(ck) ?? [])
        .map((p) => applyPerfBonus(p, perf, season.id, ck, finishBonus))
        .sort((a, b) => b.rating - a.rating).slice(0, 24);
      const str = squadStrength(squad, (10.5 - (i + 1)) * 0.3);
      return { id: ck, name: c.club, pos: i + 1, pts: c.pts, gf: c.gf, ga: c.ga, tier: tier(i), attack: str.attack, defense: str.defense, squad };
    });

    const players = clubs.reduce((n, c) => n + c.squad.length, 0);
    const winnerPts = table[0].pts;
    writeFileSync(join(OUT, `${season.id}.json`), JSON.stringify({ id: season.id, label: season.label, winnerPts, clubs }));
    index.push({ id: season.id, label: season.label, clubs: clubs.length, players, winnerPts });
    const thin = clubs.filter((c) => c.squad.length < 11).map((c) => c.name);
    console.log(`✓ ${season.id} ${season.label.padEnd(24)} ${clubs.length} clubs ${players} players  champ ${winnerPts}${thin.length ? `  ⚠ thin: ${thin.join(',')}` : ''}`);
  }

  index.sort((a, b) => a.id.localeCompare(b.id));
  writeFileSync(join(OUT, 'index.json'), JSON.stringify(index, null, 2));
  console.log(`\n✓ ${index.length} seasons → ${OUT}`);
}

build().catch((e) => { console.error(e); process.exit(1); });
