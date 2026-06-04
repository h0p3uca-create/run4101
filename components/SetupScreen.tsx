'use client';
import { useState } from 'react';
import { FORMATIONS } from '@/lib/data/formations';
import { SEASONS_INDEX } from '@/lib/data/seasons';
import { TARGET_POINTS } from '@/lib/engine/config';

export type StartMode = 'main' | 'challenge';
export interface StartOptions {
  mode: StartMode;
  seasonId: string | null;
  formationId: string;
  daily: boolean;
}

const FEATURED = '2017-18'; // Today's Challenge

export default function SetupScreen({ onStart }: { onStart: (o: StartOptions) => void }) {
  const [formationId, setFormationId] = useState(FORMATIONS[0].id);
  const featured = SEASONS_INDEX.find((s) => s.id === FEATURED);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-8 px-6 py-10 text-center">
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
          Roll a club, pick players onto the pitch, reach{' '}
          <span className="font-bold text-[var(--fg)]">{TARGET_POINTS} points</span>.
        </p>
      </div>

      {/* How to play */}
      <ol className="grid w-full grid-cols-3 gap-2 text-center">
        {[
          { n: '🎲', t: 'Roll', d: 'Draw a real club' },
          { n: '⚽', t: 'Pick', d: 'Place & slide players into positions' },
          { n: '🏆', t: 'Simulate', d: `38 games · reach ${TARGET_POINTS}` },
        ].map((s, i) => (
          <li key={i} className="rounded-[var(--radius)] border border-[var(--card-line)] p-3">
            <div className="text-xl">{s.n}</div>
            <div className="mt-1 text-xs font-bold uppercase tracking-wider">{s.t}</div>
            <div className="text-[10px] leading-tight text-[var(--color-muted)]">{s.d}</div>
          </li>
        ))}
      </ol>

      {/* Formation */}
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

      {/* Main mode */}
      <button
        data-testid="mode-main"
        onClick={() => onStart({ mode: 'main', seasonId: null, formationId, daily: false })}
        className="w-full rounded-[var(--radius)] bg-[var(--color-accent)] px-6 py-4 text-lg font-black text-[#1a0a1c] transition-transform hover:-translate-y-0.5"
      >
        Play · All-time XI
      </button>
      <p className="-mt-5 text-xs text-[var(--color-muted)]">
        Draw any club from any season (2000/01–2022/23) and build a dream XI.
      </p>

      {/* Challenges */}
      <div className="w-full space-y-3">
        <p className="text-left text-xs uppercase tracking-widest text-[var(--color-muted)]">
          Challenges · beat a real season
        </p>
        {featured && (
          <button
            data-testid="today-challenge"
            onClick={() => onStart({ mode: 'challenge', seasonId: FEATURED, formationId, daily: true })}
            className="flex w-full items-center justify-between rounded-[var(--radius)] border border-[var(--color-accent-2)] bg-[color-mix(in_srgb,var(--color-accent-2)_10%,transparent)] px-4 py-3 text-left"
          >
            <span>
              <span className="block text-[10px] uppercase tracking-widest text-[var(--color-accent-2)]">
                Today&apos;s Challenge
              </span>
              <span className="font-bold">{featured.label}</span>
            </span>
            <span className="text-xs text-[var(--color-muted)]">champ {featured.winnerPts}</span>
          </button>
        )}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SEASONS_INDEX.map((s) => (
            <button
              key={s.id}
              data-testid={`season-${s.id}`}
              onClick={() => onStart({ mode: 'challenge', seasonId: s.id, formationId, daily: false })}
              className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--card-line)] px-3 py-2 text-left text-sm transition-colors hover:border-[var(--color-accent)]"
            >
              <span className="font-semibold">{s.label}</span>
              <span className="text-[10px] text-[var(--color-muted)]">{s.winnerPts}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
