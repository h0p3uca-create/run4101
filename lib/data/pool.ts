import type { Player, Season } from '../types';
import { SEASONS_INDEX, getSeason } from './seasons';

/** A rollable squad: one club in one season. */
export interface DrawSource {
  key: string;
  /** e.g. "Manchester City" (challenge) or "Man City · 2017/18" (all-time). */
  label: string;
  squad: Player[];
}

function seasonShort(id: string): string {
  // "2017-18" → "17/18"
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

/** Main (all-time) mode: roll among every club of every season. */
let _allTime: DrawSource[] | null = null;
export function allTimeSources(): DrawSource[] {
  if (_allTime) return _allTime;
  const out: DrawSource[] = [];
  for (const meta of SEASONS_INDEX) {
    const season = getSeason(meta.id);
    for (const c of season.clubs) {
      out.push({
        key: `${season.id}|${c.id}`,
        label: `${c.name} · ${seasonShort(season.id)}`,
        squad: c.squad.map((p) => ({ ...p, club: `${c.name} ${seasonShort(season.id)}` })),
      });
    }
  }
  _allTime = out;
  return out;
}
