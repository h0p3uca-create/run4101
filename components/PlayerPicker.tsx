'use client';
import { useMemo, useState } from 'react';
import type { Player, Position } from '@/lib/types';
import PlayerChip from './PlayerChip';

const FILTERS: (Position | 'ALL')[] = ['ALL', 'GK', 'DEF', 'MID', 'FWD'];

export default function PlayerPicker({
  available,
  legalIds,
  onPick,
  needs,
}: {
  available: Player[];
  legalIds: Set<string>;
  onPick: (id: string) => void;
  needs: Record<Position, number>;
}) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALL');
  const [club, setClub] = useState<string>('ALL');

  const clubs = useMemo(() => {
    const set = new Set<string>();
    for (const p of available) if (p.club) set.add(p.club);
    return [...set].sort();
  }, [available]);

  const list = useMemo(() => {
    const f = available.filter(
      (p) =>
        (filter === 'ALL' || p.pos === filter) &&
        (club === 'ALL' || p.club === club),
    );
    // legal (needed) first, then by rating
    return f.sort((a, b) => {
      const la = legalIds.has(a.id) ? 1 : 0;
      const lb = legalIds.has(b.id) ? 1 : 0;
      if (la !== lb) return lb - la;
      return b.rating - a.rating;
    });
  }, [available, filter, club, legalIds]);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {FILTERS.map((f) => {
          const need = f !== 'ALL' ? needs[f] : 0;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
                filter === f
                  ? 'bg-[var(--color-accent)] text-[#1a0a1c]'
                  : 'border border-[var(--card-line)] text-[var(--color-muted)] hover:text-[var(--fg)]'
              }`}
            >
              {f}
              {f !== 'ALL' && need > 0 && (
                <span className="ml-1 text-[var(--color-accent-2)]">·{need}</span>
              )}
            </button>
          );
        })}
      </div>

      {clubs.length > 0 && (
        <select
          data-testid="club-filter"
          value={club}
          onChange={(e) => setClub(e.target.value)}
          className="w-full rounded-[var(--radius)] border border-[var(--card-line)] bg-[var(--card)] px-3 py-2 text-sm"
        >
          <option value="ALL">All clubs</option>
          {clubs.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      )}

      <div className="grid max-h-[46vh] grid-cols-1 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
        {list.map((p) => (
          <PlayerChip
            key={p.id}
            player={p}
            onPick={onPick}
            disabled={!legalIds.has(p.id)}
          />
        ))}
        {list.length === 0 && (
          <p className="col-span-full py-6 text-center text-sm text-[var(--color-muted)]">
            No players left in this filter.
          </p>
        )}
      </div>
    </div>
  );
}
