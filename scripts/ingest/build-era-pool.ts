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

// Rating shaping. The source data hard-caps stars at 91, so a club's whole
// peak line stacks at the ceiling. We keep each player's BEST window season,
// but THIN the 90+ cluster by how sustained that level was — a player who held
// it for 3+ seasons stays elite, a one-season spike is demoted to the 80s. This
// keeps ~1–3 genuine 90+ players per great era (Henry alone for Arsenal 00–05,
// Ronaldo/Rooney/Van der Sar for Man Utd 05–10) instead of six flat 91s.
const ELITE_FLOOR = 90; // only ratings at/above this get thinned
const SUSTAIN_AT = 89; // a "sustained elite" season counts at/above this
function eliteDemotion(sustainedSeasons: number): number {
  if (sustainedSeasons >= 3) return 0; // career-defining era → keep peak
  if (sustainedSeasons === 2) return 2;
  return 4; // one-season spike → drop into the 80s
}

/** Fixed 5-ish season windows over the 2000–2023 dataset. */
const WINDOWS = [
  { id: '00-05', start: 2000, end: 2004 },
  { id: '05-10', start: 2005, end: 2009 },
  { id: '10-15', start: 2010, end: 2014 },
  { id: '15-20', start: 2015, end: 2019 },
  { id: '20-23', start: 2020, end: 2022 },
  { id: '23-26', start: 2023, end: 2025 },
] as const;

// Keep each era tight & strong: top-N per position. Trimmed so the pick list is
// the recognisable core, not deep filler (every formation still fields with some
// choice: 3-5-2 needs MID5/DEF3/FWD2, all covered).
const CAPS = { GK: 2, DEF: 8, MID: 8, FWD: 7 } as const;

// Drop the weakest eras entirely — a pure no-name relegation squad is no fun to
// draw. (strength = mean of the best 16 ratings; see below.)
const MIN_ERA_STRENGTH = 64;

const startYear = (seasonId: string) => parseInt(seasonId.slice(0, 4), 10);
const windowLabel = (id: string) => id.replace('-', '–'); // "05-10" → "05–10"
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
interface EraSource { key: string; label: string; strength: number; squad: Player[] }
const sources: EraSource[] = [];

for (const [clubId, seasons] of byClub) {
  for (const w of WINDOWS) {
    const inWindow = seasons.filter((s) => s.year >= w.start && s.year <= w.end);
    if (inWindow.length === 0) continue;

    // most recent club name in the window (names can drift, e.g. " FC" suffix)
    const clubName = inWindow[inWindow.length - 1].name;
    const wl = windowLabel(w.id);

    // best (highest-rated) version of each player + all their window ratings
    const best = new Map<string, Player>();
    const ratingsOf = new Map<string, number[]>();
    for (const cs of inWindow) {
      for (const p of cs.squad) {
        const k = nameKey(p.name);
        const cur = best.get(k);
        if (!cur || p.rating > cur.rating) best.set(k, p);
        (ratingsOf.get(k) ?? ratingsOf.set(k, []).get(k)!).push(p.rating);
      }
    }

    // Shape: keep the peak season, but thin the 90+ cluster by how sustained it
    // was (one-season spikes drop into the 80s). att/def shift with the rating.
    const shaped = [...best.entries()].map(([k, p]) => {
      const ratings = ratingsOf.get(k)!;
      let delta = 0;
      if (p.rating >= ELITE_FLOOR) {
        const sustained = ratings.filter((r) => r >= SUSTAIN_AT).length;
        delta = -eliteDemotion(sustained);
      }
      return {
        ...p,
        id: `${clubId}-${w.id}-${slug(p.name)}`,
        att: Math.min(99, p.att + delta),
        def: Math.min(99, p.def + delta),
        rating: Math.min(99, p.rating + delta),
        era: wl,
        club: `${clubName} ${wl}`,
      };
    });

    const capped: Player[] = [];
    for (const pos of ['GK', 'DEF', 'MID', 'FWD'] as const) {
      capped.push(
        ...shaped
          .filter((p) => p.pos === pos)
          .sort((a, b) => b.rating - a.rating)
          .slice(0, CAPS[pos]),
      );
    }

    // viability: enough to field a 4-3-3 / 3-5-2 etc.
    const have = (pos: string) => capped.filter((p) => p.pos === pos).length;
    if (have('GK') < 1 || have('DEF') < 4 || have('MID') < 3 || have('FWD') < 2) continue;

    // Appeal score = mean of the era's best 16 ratings. Drives weighted rolls
    // (stronger eras come up more often) — see rollbuild.drawSource.
    const top16 = [...capped].sort((a, b) => b.rating - a.rating).slice(0, 16);
    const strength = Math.round(top16.reduce((s, p) => s + p.rating, 0) / top16.length);
    if (strength < MIN_ERA_STRENGTH) continue; // skip pure no-name squads

    sources.push({
      key: `${clubId}|${w.id}`,
      label: `${clubName} · ${wl}`,
      strength,
      squad: capped,
    });
  }
}

writeFileSync(OUT, JSON.stringify(sources));
const players = sources.reduce((n, s) => n + s.squad.length, 0);
const ratings = sources.flatMap((s) => s.squad.map((p) => p.rating));
const avg = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
console.log(`✓ pool.json: ${sources.length} eras, ${players} players, avg rating ${avg} → ${OUT}`);
