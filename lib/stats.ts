// Local, account-free play stats — best score + attempt count, persisted in
// localStorage. SSR-safe (every accessor guards `window`). Never throws: a
// blocked/again-full localStorage just degrades to "no stats".

const KEY = 'runfor101-stats:v1';

export interface PlayStats {
  /** Best points reached across all sessions. */
  best: number;
  /** Total seasons simulated. */
  attempts: number;
  /** How many times the 101 record was beaten. */
  records: number;
}

const EMPTY: PlayStats = { best: 0, attempts: 0, records: 0 };

export function readStats(): PlayStats {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<PlayStats>;
    return {
      best: Number(parsed.best) || 0,
      attempts: Number(parsed.attempts) || 0,
      records: Number(parsed.records) || 0,
    };
  } catch {
    return EMPTY;
  }
}

/** Record one finished season; returns the updated stats (and whether it's a new best). */
export function recordResult(points: number, reachedTarget: boolean): PlayStats & { isBest: boolean } {
  const prev = readStats();
  const isBest = points > prev.best;
  const next: PlayStats = {
    best: Math.max(prev.best, points),
    attempts: prev.attempts + 1,
    records: prev.records + (reachedTarget ? 1 : 0),
  };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage blocked/full — stats just won't persist */
    }
  }
  return { ...next, isBest };
}
