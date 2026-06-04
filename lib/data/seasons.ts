import type { Opponent, Player, Season, SeasonMeta } from '../types';
import index from './seasons/index.json';
import s201718 from './seasons/2017-18.json';
import s201819 from './seasons/2018-19.json';
import s202021 from './seasons/2020-21.json';

// Static imports so the bundler ships the JSON (works with static export).
const SEASON_MAP: Record<string, Season> = {
  '2017-18': s201718 as Season,
  '2018-19': s201819 as Season,
  '2020-21': s202021 as Season,
};

export const SEASONS_INDEX = index as SeasonMeta[];

export function getSeason(id: string): Season {
  const s = SEASON_MAP[id];
  if (!s) throw new Error(`Unknown season: ${id}`);
  return s;
}

export const DEFAULT_SEASON_ID = SEASONS_INDEX[0]?.id ?? '2017-18';

/** Flatten a season's squads into one draft pool, tagging each with its club. */
export function seasonPool(season: Season): Player[] {
  return season.clubs.flatMap((c) =>
    c.squad.map((p) => ({ ...p, club: c.name })),
  );
}

/**
 * Opponents for a 38-game season: the 19 strongest real clubs of that season
 * (the 20th/weakest is dropped so the player occupies a league slot). Their
 * players still appear in the draft pool.
 */
export function seasonOpponents(season: Season): Opponent[] {
  return [...season.clubs]
    .sort((a, b) => a.pos - b.pos)
    .slice(0, 19)
    .map((c) => ({
      id: c.id,
      name: c.name,
      attack: c.attack,
      defense: c.defense,
      tier: c.tier,
    }));
}

/** Distinct club names of a season, in finishing order (for the picker). */
export function seasonClubs(season: Season): { id: string; name: string }[] {
  return [...season.clubs]
    .sort((a, b) => a.pos - b.pos)
    .map((c) => ({ id: c.id, name: c.name }));
}
