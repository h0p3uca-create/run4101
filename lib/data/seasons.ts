import type { Opponent, Player, Season, SeasonMeta } from '../types';
import index from './seasons/index.json';

// The index is tiny and ships eagerly (drives the menu). Full season squads are
// code-split and loaded on demand so the initial bundle stays light.
export const SEASONS_INDEX = index as SeasonMeta[];
export const DEFAULT_SEASON_ID = SEASONS_INDEX[0]?.id ?? '2017-18';

// Static map of dynamic importers → one lazy chunk per season.
const LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  '2000-01': () => import('./seasons/2000-01.json'),
  '2001-02': () => import('./seasons/2001-02.json'),
  '2002-03': () => import('./seasons/2002-03.json'),
  '2003-04': () => import('./seasons/2003-04.json'),
  '2004-05': () => import('./seasons/2004-05.json'),
  '2005-06': () => import('./seasons/2005-06.json'),
  '2007-08': () => import('./seasons/2007-08.json'),
  '2008-09': () => import('./seasons/2008-09.json'),
  '2009-10': () => import('./seasons/2009-10.json'),
  '2010-11': () => import('./seasons/2010-11.json'),
  '2011-12': () => import('./seasons/2011-12.json'),
  '2012-13': () => import('./seasons/2012-13.json'),
  '2013-14': () => import('./seasons/2013-14.json'),
  '2014-15': () => import('./seasons/2014-15.json'),
  '2015-16': () => import('./seasons/2015-16.json'),
  '2016-17': () => import('./seasons/2016-17.json'),
  '2017-18': () => import('./seasons/2017-18.json'),
  '2018-19': () => import('./seasons/2018-19.json'),
  '2019-20': () => import('./seasons/2019-20.json'),
  '2020-21': () => import('./seasons/2020-21.json'),
  '2021-22': () => import('./seasons/2021-22.json'),
  '2022-23': () => import('./seasons/2022-23.json'),
};

const cache = new Map<string, Season>();

export async function loadSeason(id: string): Promise<Season> {
  const hit = cache.get(id);
  if (hit) return hit;
  const loader = LOADERS[id];
  if (!loader) throw new Error(`Unknown season: ${id}`);
  const mod = await loader();
  const season = ((mod as { default?: unknown }).default ?? mod) as Season;
  cache.set(id, season);
  return season;
}

export async function loadAllSeasons(): Promise<Season[]> {
  return Promise.all(SEASONS_INDEX.map((m) => loadSeason(m.id)));
}

// ── pure helpers operating on a loaded Season ─────────────────

/** Flatten a season's squads into one draft pool, tagging each with its club. */
export function seasonPool(season: Season): Player[] {
  return season.clubs.flatMap((c) => c.squad.map((p) => ({ ...p, club: c.name })));
}

/** The 19 strongest real clubs of the season (the player takes a league slot). */
export function seasonOpponents(season: Season): Opponent[] {
  return [...season.clubs]
    .sort((a, b) => a.pos - b.pos)
    .slice(0, 19)
    .map((c) => ({ id: c.id, name: c.name, attack: c.attack, defense: c.defense, tier: c.tier }));
}
