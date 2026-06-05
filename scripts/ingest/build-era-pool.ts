// Build the ALL-TIME pool as club ERAS (fixed multi-season windows) instead of
// single seasons. Each era = one club over a 5-ish year window; every player is
// represented by their BEST season in that window, then buffed. This gives a
// narrower, stronger, more recognisable pool ("Man Utd · 05–10") with higher
// overalls than the season-by-season pool.
//
// Replaces lib/data/pool.json (consumed by allTimeSources / main mode).
// Run: npx tsx scripts/ingest/build-era-pool.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Player, Season, SeasonMeta } from '../../lib/types';

const DIR = join('lib', 'data', 'seasons');
const OUT = join('lib', 'data', 'pool.json');

/** Flat buff added to a player's best-season att/def/rating (capped at 99). */
export const ERA_BUFF = 5;

/** Fixed 5-ish season windows over the 2000–2023 dataset. */
const WINDOWS = [
  { id: '00-05', start: 2000, end: 2004 },
  { id: '05-10', start: 2005, end: 2009 },
  { id: '10-15', start: 2010, end: 2014 },
  { id: '15-20', start: 2015, end: 2019 },
  { id: '20-23', start: 2020, end: 2022 },
] as const;

// Keep each era tight & strong: top-N per position (covers any formation with
// real scarcity, avoids 50-deep union squads).
const CAPS = { GK: 3, DEF: 10, MID: 10, FWD: 9 } as const;

const startYear = (seasonId: string) => parseInt(seasonId.slice(0, 4), 10);
const windowLabel = (id: string) => id.replace('-', '–'); // "05-10" → "05–10"
const buff = (n: number) => Math.min(99, Math.round(n + ERA_BUFF));
const stripDiacritics = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const nameKey = (name: string) => stripDiacritics(name.toLowerCase()).replace(/[^a-z]/g, '');
const slug = (name: string) => stripDiacritics(name.toLowerCase()).replace(/[^a-z0-9]/g, '');

interface ClubSeason { name: string; year: number; squad: Player[] }

// 1) collect every club's seasons, grouped by stable club id
const index = JSON.parse(readFileSync(join(DIR, 'index.json'), 'utf-8')) as SeasonMeta[];
const byClub = new Map<string, ClubSeason[]>();
for (const meta of index) {
  const season = JSON.parse(readFileSync(join(DIR, `${meta.id}.json`), 'utf-8')) as Season;
  const year = startYear(season.id);
  for (const c of season.clubs) {
    const list = byClub.get(c.id) ?? [];
    list.push({ name: c.name, year, squad: c.squad });
    byClub.set(c.id, list);
  }
}

// 2) for each club × window, aggregate best-season players + buff
interface EraSource { key: string; label: string; squad: Player[] }
const sources: EraSource[] = [];

for (const [clubId, seasons] of byClub) {
  for (const w of WINDOWS) {
    const inWindow = seasons.filter((s) => s.year >= w.start && s.year <= w.end);
    if (inWindow.length === 0) continue;

    // most recent club name in the window (names can drift, e.g. " FC" suffix)
    const clubName = inWindow[inWindow.length - 1].name;
    const wl = windowLabel(w.id);

    // best (highest-rated) version of each player across the window's seasons
    const best = new Map<string, Player>();
    for (const cs of inWindow) {
      for (const p of cs.squad) {
        const k = nameKey(p.name);
        const cur = best.get(k);
        if (!cur || p.rating > cur.rating) best.set(k, p);
      }
    }

    // buff, cap per position, keep highest-rated
    const buffed = [...best.values()].map((p) => ({
      ...p,
      id: `${clubId}-${w.id}-${slug(p.name)}`,
      att: buff(p.att),
      def: buff(p.def),
      rating: buff(p.rating),
      era: wl,
      club: `${clubName} ${wl}`,
    }));

    const capped: Player[] = [];
    for (const pos of ['GK', 'DEF', 'MID', 'FWD'] as const) {
      capped.push(
        ...buffed
          .filter((p) => p.pos === pos)
          .sort((a, b) => b.rating - a.rating)
          .slice(0, CAPS[pos]),
      );
    }

    // viability: enough to field a 4-3-3 / 3-5-2 etc.
    const have = (pos: string) => capped.filter((p) => p.pos === pos).length;
    if (have('GK') < 1 || have('DEF') < 4 || have('MID') < 3 || have('FWD') < 2) continue;

    sources.push({
      key: `${clubId}|${w.id}`,
      label: `${clubName} · ${wl}`,
      squad: capped,
    });
  }
}

writeFileSync(OUT, JSON.stringify(sources));
const players = sources.reduce((n, s) => n + s.squad.length, 0);
const ratings = sources.flatMap((s) => s.squad.map((p) => p.rating));
const avg = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
console.log(`✓ pool.json: ${sources.length} eras, ${players} players, avg rating ${avg} → ${OUT}`);
