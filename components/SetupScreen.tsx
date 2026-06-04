'use client';
import { useState } from 'react';
import { FORMATIONS } from '@/lib/data/formations';
import { SEASONS_INDEX, DEFAULT_SEASON_ID } from '@/lib/data/seasons';
import { TARGET_POINTS } from '@/lib/engine/config';

export type StartMode = 'daily' | 'random';

export default function SetupScreen({
  onStart,
}: {
  onStart: (seasonId: string, formationId: string, mode: StartMode) => void;
}) {
  const [seasonId, setSeasonId] = useState(DEFAULT_SEASON_ID);
  const [formationId, setFormationId] = useState(FORMATIONS[0].id);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-8 px-6 py-12 text-center">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
          Premier League — inspired
        </p>
        <h1
          className="text-6xl font-black tracking-tight sm:text-7xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Gofor<span className="text-[var(--color-accent)]">101</span>
        </h1>
        <p className="text-[var(--color-muted)]">
          Roll a club, pick a player, build an XI. Simulate 38 games. Reach{' '}
          <span className="font-bold text-[var(--fg)]">{TARGET_POINTS} points</span>.
        </p>
      </div>

      <div className="w-full space-y-3">
        <p className="text-left text-xs uppercase tracking-widest text-[var(--color-muted)]">
          Season
        </p>
        <div className="grid grid-cols-1 gap-2">
          {SEASONS_INDEX.map((s) => (
            <button
              key={s.id}
              data-testid={`season-${s.id}`}
              onClick={() => setSeasonId(s.id)}
              className={`flex items-center justify-between rounded-[var(--radius)] border px-4 py-3 text-left transition-colors ${
                seasonId === s.id
                  ? 'border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)]'
                  : 'border-[var(--card-line)] text-[var(--color-muted)] hover:text-[var(--fg)]'
              }`}
            >
              <span className="font-bold">{s.label}</span>
              <span className="text-xs text-[var(--color-muted)]">
                champion {s.winnerPts} pts
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="w-full space-y-3">
        <p className="text-left text-xs uppercase tracking-widest text-[var(--color-muted)]">
          Formation
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FORMATIONS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFormationId(f.id)}
              className={`rounded-[var(--radius)] border py-3 text-sm font-bold tabular-nums transition-colors ${
                formationId === f.id
                  ? 'border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)]'
                  : 'border-[var(--card-line)] text-[var(--color-muted)] hover:text-[var(--fg)]'
              }`}
              style={{ fontFamily: 'var(--font-numeral)' }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <button
          data-testid="mode-daily"
          onClick={() => onStart(seasonId, formationId, 'daily')}
          className="flex-1 rounded-[var(--radius)] bg-[var(--color-accent)] px-6 py-3 font-bold text-[#1a0a1c] transition-transform hover:-translate-y-0.5"
        >
          Today&apos;s Challenge
        </button>
        <button
          data-testid="mode-random"
          onClick={() => onStart(seasonId, formationId, 'random')}
          className="flex-1 rounded-[var(--radius)] border border-[var(--card-line)] px-6 py-3 font-bold transition-colors hover:border-[var(--color-accent)]"
        >
          Random Draft
        </button>
      </div>
      <p className="text-xs text-[var(--color-muted)]">
        Today&apos;s Challenge gives everyone the same draft. Share your score.
      </p>
    </div>
  );
}
