'use client';
import { useState } from 'react';
import type { Player } from '@/lib/types';
import { FORMATIONS, getFormation } from '@/lib/data/formations';
import { SEASONS_INDEX } from '@/lib/data/seasons';
import { TARGET_POINTS } from '@/lib/engine/config';
import Pitch from './Pitch';

export type StartMode = 'main' | 'challenge';
export interface StartOptions {
  mode: StartMode;
  seasonId: string | null;
  formationId: string;
  daily: boolean;
}

const FEATURED = '2017-18';

// Decorative dream XI for the hero pitch.
const DREAM: Record<string, { name: string; rating: number; pos: Player['pos']; code: string }> = {
  gk: { name: 'Alisson', rating: 90, pos: 'GK', code: 'GK' },
  lb: { name: 'Robertson', rating: 87, pos: 'DEF', code: 'LB' },
  cbL: { name: 'Van Dijk', rating: 91, pos: 'DEF', code: 'CB' },
  cbR: { name: 'Kompany', rating: 88, pos: 'DEF', code: 'CB' },
  rb: { name: 'Alexander-Arnold', rating: 87, pos: 'DEF', code: 'RB' },
  cmL: { name: 'De Bruyne', rating: 92, pos: 'MID', code: 'CM' },
  cmC: { name: 'Gerrard', rating: 90, pos: 'MID', code: 'CM' },
  cmR: { name: 'Lampard', rating: 90, pos: 'MID', code: 'CM' },
  lw: { name: 'Hazard', rating: 89, pos: 'FWD', code: 'LW' },
  st: { name: 'Agüero', rating: 90, pos: 'FWD', code: 'ST' },
  rw: { name: 'Salah', rating: 90, pos: 'FWD', code: 'RW' },
};
const DREAM_PLACED: Record<string, Player> = Object.fromEntries(
  Object.entries(DREAM).map(([slot, p]) => [
    slot,
    { id: slot, name: p.name, pos: p.pos, att: p.rating, def: p.rating, rating: p.rating, positions: [p.code] },
  ]),
);

export default function SetupScreen({ onStart }: { onStart: (o: StartOptions) => void }) {
  const [formationId, setFormationId] = useState(FORMATIONS[0].id);
  const [showChallenges, setShowChallenges] = useState(false);
  const featured = SEASONS_INDEX.find((s) => s.id === FEATURED);

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16 pt-4">
      {/* Hero */}
      <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left — copy + CTA (leads on mobile and desktop) */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-[var(--color-muted)]">
            Premier League · 2000 — 2023
          </p>
          <h1
            className="mt-3 select-none text-7xl leading-[0.82] sm:text-8xl"
            style={{ fontFamily: 'var(--font-display)', textShadow: '5px 5px 0 var(--color-accent-2)' }}
          >
            RUNFOR<span className="text-[var(--color-accent)]">101</span>
          </h1>
          <p
            className="mt-6 text-4xl leading-[0.95] sm:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Roll a club.<br />Build your dream XI.
          </p>
          <p className="mt-5 max-w-md text-[var(--color-muted)]">
            Roll the dice: you get a real club from any season. Pick players who were
            actually there, fill all 11 and simulate — can you reach{' '}
            <span className="font-bold text-[var(--fg)]">{TARGET_POINTS} points</span>?
          </p>

          {/* Formation */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
              Shape
            </span>
            {FORMATIONS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFormationId(f.id)}
                className={`rounded-full border px-3 py-1 text-sm font-bold tabular-nums transition-colors ${
                  formationId === f.id
                    ? 'border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_14%,transparent)]'
                    : 'border-[var(--card-line)] text-[var(--color-muted)] hover:text-[var(--fg)]'
                }`}
                style={{ fontFamily: 'var(--font-numeral)' }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Play */}
          <button
            data-testid="mode-main"
            onClick={() => onStart({ mode: 'main', seasonId: null, formationId, daily: false })}
            className="mt-6 w-full rounded-[var(--radius)] bg-[var(--color-accent-2)] px-6 py-5 text-2xl font-black uppercase tracking-wide text-white shadow-[5px_5px_0_var(--color-pl-ink)] transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:w-auto sm:px-12"
            style={{ fontFamily: 'var(--font-head)' }}
          >
            Roll 🎲
          </button>
        </div>

        {/* Right — sample pitch */}
        <div className="mx-auto w-full max-w-xs lg:max-w-none">
          <Pitch formation={getFormation('4-3-3')} placed={DREAM_PLACED} />
          <p className="mt-2 text-center text-[11px] text-[var(--color-muted)]">
            A dream XI — drawn from 24 seasons of real squads
          </p>
        </div>
      </div>

      {/* How to play */}
      <ol className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { n: '01', t: 'Roll a club', d: 'Any club from any season' },
          { n: '02', t: 'Pick & place', d: 'Fill the XI by position, slide players around' },
          { n: '03', t: 'Simulate', d: `38 games · reach ${TARGET_POINTS} points` },
        ].map((s) => (
          <li key={s.n} className="rounded-[var(--radius)] border border-[var(--card-line)] p-4">
            <div className="text-sm font-black text-[var(--color-accent)]" style={{ fontFamily: 'var(--font-numeral)' }}>
              {s.n}
            </div>
            <div className="mt-1 text-base font-bold">{s.t}</div>
            <div className="text-xs text-[var(--color-muted)]">{s.d}</div>
          </li>
        ))}
      </ol>

      {/* Challenges (hidden by default) */}
      <div className="mt-10 border-t border-[var(--card-line)] pt-5">
        <button
          data-testid="toggle-challenges"
          aria-expanded={showChallenges}
          onClick={() => setShowChallenges((s) => !s)}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] hover:text-[var(--fg)]"
        >
          ⚑ Season challenges <span className="text-[var(--color-accent)]">{showChallenges ? '▴' : '▾'}</span>
        </button>

        {showChallenges && (
          <div className="mt-4 animate-fade-in space-y-3">
            <p className="text-xs text-[var(--color-muted)]">
              Take on one real season vs that season&apos;s actual clubs — beat their champion.
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
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {SEASONS_INDEX.map((s) => (
                <button
                  key={s.id}
                  data-testid={`season-${s.id}`}
                  onClick={() => onStart({ mode: 'challenge', seasonId: s.id, formationId, daily: false })}
                  className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--card-line)] px-3 py-2 text-left text-sm transition-colors hover:border-[var(--color-accent)]"
                >
                  <span className="truncate font-semibold">{s.label}</span>
                  <span className="ml-2 text-[10px] text-[var(--color-muted)]">{s.winnerPts}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
