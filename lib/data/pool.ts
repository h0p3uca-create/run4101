import type { Player, Season } from '../types';
import { loadAllSeasons } from './seasons';

/** A rollable squad: one club in one season. */
export interface DrawSource {
  key: string;
  /** e.g. "Manchester City" (challenge) or "Man City · 17/18" (all-time). */
  label: string;
  squad: Player[];
}

function seasonShort(id: string): string {
  const [a, b] = id.split('-');
  return `${a.slice(2)}/${b}`;
}

/** Challenge mode: roll among the clubs of one fixed season. */
export function seasonSources(season: Season): DrawSource[] {
  return season.clubs.map((c) => ({
    key: `${season.id}|${c.id}`,
    label: c.name,
    squad: c.squad.map((p) => ({ ...p, club: c.name })),
  }));
}

/** Main (all-time) mode: roll among every club of every season (lazy-loaded). */
export async function allTimeSources(): Promise<DrawSource[]> {
  const seasons = await loadAllSeasons();
  const out: DrawSource[] = [];
  for (const season of seasons) {
    const short = seasonShort(season.id);
    for (const c of season.clubs) {
      out.push({
        key: `${season.id}|${c.id}`,
        label: `${c.name} · ${short}`,
        squad: c.squad.map((p) => ({ ...p, club: `${c.name} ${short}` })),
      });
    }
  }
  return out;
}
