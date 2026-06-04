import type { Player, Season } from '../types';

/** A rollable squad: one club in one season. */
export interface DrawSource {
  key: string;
  /** e.g. "Manchester City" (challenge) or "Man City · 17/18" (all-time). */
  label: string;
  squad: Player[];
}

/** Challenge mode: roll among the clubs of one fixed season. */
export function seasonSources(season: Season): DrawSource[] {
  return season.clubs.map((c) => ({
    key: `${season.id}|${c.id}`,
    label: c.name,
    squad: c.squad.map((p) => ({ ...p, club: c.name })),
  }));
}

/**
 * Main (all-time) mode: a single pre-built slim pool (one code-split chunk, one
 * request) instead of loading all 22 season files. Built by build-pool.ts.
 */
let _pool: DrawSource[] | null = null;
export async function allTimeSources(): Promise<DrawSource[]> {
  if (_pool) return _pool;
  const mod = await import('./pool.json');
  _pool = ((mod as { default?: unknown }).default ?? mod) as DrawSource[];
  return _pool;
}
