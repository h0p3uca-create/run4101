// ─────────────────────────────────────────────────────────────
// Build real season datasets for Gofor101.
//
//   openfootball/england (CC0)  → real clubs, results → attack/defense, tier
//   FIFA/EA player CSV (mirror) → real squads → per-season att/def/overall/pos
//
// Output: lib/data/seasons/<id>.json + lib/data/seasons/index.json
// Run:    npx tsx scripts/ingest/build-seasons.ts
//
// Data credits (non-commercial fan project, no crests/marks):
//   - Results: github.com/openfootball/england (Public Domain / CC0)
//   - Ratings: FIFA/EA player attributes via open GitHub mirror
//     (amanthedorkknight/fifa18-all-player-statistics), CC BY-NC-SA.
// ─────────────────────────────────────────────────────────────
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const OF_RAW = 'https://raw.githubusercontent.com/openfootball/england/master';
const FIFA_RAW =
  'https://raw.githubusercontent.com/amanthedorkknight/fifa18-all-player-statistics/master';
const CACHE = join('scripts', 'ingest', '.cache');
const OUT = join('lib', 'data', 'seasons');

interface SeasonSource {
  id: string;
  label: string;
  /** Relative path under FIFA_RAW (amanthedorkknight mirror). */
  fifaCsv?: string;
  /** Or a full CSV URL (other mirrors / editions). */
  fifaUrl?: string;
  winnerPts: number; // real champion points (flavor: "they got X, get 101")
}

const SEASONS: SeasonSource[] = [
  { id: '2017-18', label: '2017/18 · The Centurions', fifaCsv: 'Complete/CompleteDataset.csv', winnerPts: 100 },
  { id: '2018-19', label: '2018/19 · 98 vs 97', fifaCsv: '2019/data.csv', winnerPts: 98 },
  { id: '2020-21', label: '2020/21 · City reclaim it', fifaCsv: '2021/data.csv', winnerPts: 86 },
  {
    id: '2022-23',
    label: '2022/23 · The Treble',
    fifaUrl: 'https://raw.githubusercontent.com/miraehab/FIFA-23-ML-Project/main/players_fifa23.csv',
    winnerPts: 89,
  },
];

type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

async function cachedFetch(url: string, cacheName: string): Promise<string> {
  mkdirSync(CACHE, { recursive: true });
  const path = join(CACHE, cacheName);
  if (existsSync(path)) return readFileSync(path, 'utf-8');
  process.stdout.write(`  fetching ${cacheName}… `);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch ${res.status}: ${url}`);
  const text = await res.text();
  writeFileSync(path, text);
  console.log(`${(text.length / 1e6).toFixed(1)}MB`);
  return text;
}

// ── openfootball results → club strengths ──────────────────────
const LINE = /^\s*(?:\d{1,2}[:.]\d{2}\s+)?(.+?)\s{2,}(\d+)-(\d+)(?:\s+\(\d+-\d+\))?\s{2,}(.+?)\s*$/;

interface ClubRow {
  club: string; p: number; w: number; d: number; l: number;
  gf: number; ga: number; pts: number;
}

function standings(text: string): ClubRow[] {
  const t = new Map<string, ClubRow>();
  const get = (c: string) =>
    t.get(c) ?? t.set(c, { club: c, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }).get(c)!;
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
  return [...t.values()].sort(
    (x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf,
  );
}

// Club strength must live on the SAME scale as a drafted XI, so we compute it
// from the club's best 4-3-3 using the engine's exact teamStrength weights
// (lib/engine/ratings.ts). A small ± nudge from real league finish adds realism
// (over/under-performers) without breaking scale parity.
const W_ATT = { FWD: 0.5, MID: 0.35, DEF: 0.15 };
const W_DEF = { GK: 0.3, DEF: 0.45, MID: 0.25 };

function bestXi(squad: PlayerSeason[]) {
  const top = (pos: Position, n: number, key: (p: PlayerSeason) => number) =>
    squad.filter((p) => p.pos === pos).sort((a, b) => key(b) - key(a)).slice(0, n);
  return [
    ...top('GK', 1, (p) => p.def),
    ...top('DEF', 4, (p) => p.def * 0.7 + p.att * 0.3),
    ...top('MID', 3, (p) => p.rating),
    ...top('FWD', 3, (p) => p.att),
  ];
}

function squadStrength(squad: PlayerSeason[], posNudge: number) {
  const xi = bestXi(squad);
  const meanBy = (pos: Position, k: 'att' | 'def') => {
    const g = xi.filter((p) => p.pos === pos);
    return g.length ? g.reduce((s, p) => s + p[k], 0) / g.length : 0;
  };
  const weighted = (parts: { v: number; w: number }[]) => {
    const a = parts.filter((p) => p.v > 0);
    const tw = a.reduce((s, p) => s + p.w, 0) || 1;
    return a.reduce((s, p) => s + p.v * p.w, 0) / tw;
  };
  const attack = weighted([
    { v: meanBy('FWD', 'att'), w: W_ATT.FWD },
    { v: meanBy('MID', 'att'), w: W_ATT.MID },
    { v: meanBy('DEF', 'att'), w: W_ATT.DEF },
  ]);
  const defense = weighted([
    { v: meanBy('GK', 'def'), w: W_DEF.GK },
    { v: meanBy('DEF', 'def'), w: W_DEF.DEF },
    { v: meanBy('MID', 'def'), w: W_DEF.MID },
  ]);
  const clamp = (v: number) => Math.max(42, Math.min(95, Math.round(v + posNudge)));
  return { attack: clamp(attack), defense: clamp(defense) };
}

function tier(pos: number): 'title' | 'europe' | 'mid' | 'relegation' {
  return pos < 4 ? 'title' : pos < 7 ? 'europe' : pos < 17 ? 'mid' : 'relegation';
}

// ── club name normalisation (openfootball ↔ FIFA) ──────────────
function normClub(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\b(fc|afc|cf)\b/g, '')
    .replace(/[^a-z]/g, '')
    .trim();
}
const CLUB_ALIASES: Record<string, string> = {
  // fifa form → openfootball-normalised key
  bournemouth: 'afcbournemouth',
  spurs: 'tottenhamhotspur',
  wolves: 'wolverhamptonwanderers',
  manchesterutd: 'manchesterunited',
  westbrom: 'westbromwichalbion',
};
function clubKey(name: string): string {
  const k = normClub(name);
  return CLUB_ALIASES[k] ?? k;
}

// ── FIFA position → group ──────────────────────────────────────
function posGroup(raw: string): Position {
  const p = (raw || '').trim().toUpperCase().split(/[\s,]+/)[0]; // "ST LW" / "CM,CAM" → first
  if (p === 'GK') return 'GK';
  if (/(CB|LB|RB|WB)/.test(p)) return 'DEF';
  if (/(CM|DM|AM|LM|RM|^M$)/.test(p)) return 'MID';
  if (/(ST|CF|LW|RW|LF|RF|LS|RS|^F$)/.test(p)) return 'FWD';
  return 'MID';
}

const num = (v: string | undefined) => {
  if (!v) return 0;
  const m = /-?\d+/.exec(v);
  return m ? +m[0] : 0;
};

// CSV parse (handles quoted fields)
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.length);
  const header = splitCsvLine(lines[0]);
  return lines.slice(1).map((l) => {
    const cells = splitCsvLine(l);
    const row: Record<string, string> = {};
    header.forEach((h, i) => (row[h] = cells[i] ?? ''));
    return row;
  });
}
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') q = !q;
    else if (c === ',' && !q) { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

// Attacking attributes skew lower than defensive ones once averaged, which
// suppresses scoring and caps points. A small boost rebalances att vs def so a
// strong XI can actually run up a title-winning tally.
const ATT_BOOST = 6;
const ATT = ['Finishing', 'ShotPower', 'LongShots', 'Positioning', 'Volleys', 'Dribbling', 'BallControl', 'ShortPassing', 'Vision', 'Crossing', 'Acceleration', 'SprintSpeed', 'Curve', 'Penalties'];
const DEF = ['Marking', 'StandingTackle', 'SlidingTackle', 'Interceptions', 'HeadingAccuracy', 'Strength', 'Aggression', 'Jumping'];
const GK = ['GKReflexes', 'GKDiving', 'GKHandling', 'GKPositioning'];

function avg(row: Record<string, string>, cols: string[]): number {
  const vals = cols.map((c) => num(row[c])).filter((v) => v > 0);
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
}

function field(row: Record<string, string>, ...names: string[]): string {
  for (const n of names) if (row[n] != null && row[n] !== '') return row[n];
  return '';
}

interface PlayerSeason {
  id: string; name: string; pos: Position; att: number; def: number; rating: number;
}

async function build() {
  mkdirSync(OUT, { recursive: true });
  const index: { id: string; label: string; clubs: number; players: number; winnerPts: number }[] = [];

  for (const src of SEASONS) {
    console.log(`\n■ ${src.id}`);
    const ofText = await cachedFetch(`${OF_RAW}/${src.id}/1-premierleague.txt`, `of-${src.id}.txt`);
    const table = standings(ofText);
    if (table.length < 18) { console.warn(`  ⚠ ${table.length} clubs, skipping`); continue; }

    const clubKeys = new Map(table.map((c, i) => [clubKey(c.club), { row: c, pos: i }]));

    const fifaUrl = src.fifaUrl ?? `${FIFA_RAW}/${src.fifaCsv}`;
    const fifaText = await cachedFetch(fifaUrl, `fifa-${src.id}.csv`);
    const rows = parseCsv(fifaText);

    // group players by club (only PL clubs of this season)
    const squads = new Map<string, PlayerSeason[]>();
    for (const r of rows) {
      const club = field(r, 'Club');
      const key = clubKey(club);
      if (!clubKeys.has(key)) continue;
      const pos = posGroup(
        field(r, 'Position', 'BestPosition', 'Positions', 'Preferred Positions', 'player_positions'),
      );
      const overall = num(field(r, 'Overall', 'overall'));
      if (overall < 40) continue;
      const isGk = pos === 'GK';
      const att = isGk ? 12 : Math.min(99, avg(r, ATT) + ATT_BOOST);
      const def = isGk ? Math.max(avg(r, GK), overall) : avg(r, DEF);
      const name = field(r, 'Name', 'short_name', 'long_name');
      const ps: PlayerSeason = {
        id: `${src.id}-${normClub(club)}-${normClub(name)}`.replace(/-+/g, '-'),
        name, pos,
        att: att || overall,
        def: def || Math.round(overall * 0.6),
        rating: overall,
      };
      if (!squads.has(key)) squads.set(key, []);
      squads.get(key)!.push(ps);
    }

    const clubs = table.map((c, i) => {
      const squad = (squads.get(clubKey(c.club)) ?? [])
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 24); // top 24 per club
      const nudge = (10.5 - (i + 1)) * 0.3; // ±~3 from real finish
      const str = squadStrength(squad, nudge);
      return {
        id: clubKey(c.club),
        name: c.club,
        pos: i + 1,
        pts: c.pts,
        gf: c.gf, ga: c.ga,
        tier: tier(i),
        attack: str.attack,
        defense: str.defense,
        squad,
      };
    });

    const playerCount = clubs.reduce((n, c) => n + c.squad.length, 0);
    const data = { id: src.id, label: src.label, winnerPts: src.winnerPts, clubs };
    writeFileSync(join(OUT, `${src.id}.json`), JSON.stringify(data));
    index.push({ id: src.id, label: src.label, clubs: clubs.length, players: playerCount, winnerPts: src.winnerPts });
    console.log(`  ✓ ${clubs.length} clubs, ${playerCount} players`);
    const missing = clubs.filter((c) => c.squad.length < 11).map((c) => `${c.name}(${c.squad.length})`);
    if (missing.length) console.warn(`  ⚠ thin squads: ${missing.join(', ')}`);
  }

  writeFileSync(join(OUT, 'index.json'), JSON.stringify(index, null, 2));
  console.log(`\n✓ wrote ${index.length} seasons → ${OUT}`);
}

build().catch((e) => { console.error(e); process.exit(1); });
