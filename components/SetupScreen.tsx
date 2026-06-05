'use client';
import { useState } from 'react';
import type { Player } from '@/lib/types';
import { FORMATIONS, getFormation } from '@/lib/data/formations';
import { SEASONS_INDEX } from '@/lib/data/seasons';
import { TARGET_POINTS } from '@/lib/engine/config';
import Pitch from './Pitch';
import Icon from './Icon';

export type StartMode = 'main' | 'challenge';
export interface StartOptions {
  mode: StartMode;
  seasonId: string | null;
  formationId: string;
  daily: boolean;
}

// Man City's 100-point Centurions — the record this whole game is built to beat.
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
          <p className="mt-4 text-sm font-bold uppercase tracking-wide text-[var(--color-accent)]">
            The record is 100. Your target is {TARGET_POINTS}.
          </p>
          <p className="mt-3 max-w-md text-[var(--color-muted)]">
            Roll to draw a real club from any season, then pick players who actually
            played there. Fill all 11, simulate 38 games — can you{' '}
            <span className="font-bold text-[var(--fg)]">beat the {TARGET_POINTS - 1}-point record</span>?
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
                className={`inline-flex min-h-[40px] items-center rounded-full border px-4 text-sm font-bold tabular-nums transition-colors ${
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
            className="mt-6 inline-flex w-full items-center justify-center gap-2.5 rounded-[var(--radius)] bg-[var(--color-accent-2)] px-6 py-5 text-2xl font-black uppercase tracking-wide text-white shadow-[5px_5px_0_var(--color-pl-ink)] transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:w-auto sm:px-12"
            style={{ fontFamily: 'var(--font-head)' }}
          >
            Roll <Icon name="dice" className="text-[0.9em]" />
          </button>
        </div>

        {/* Right — sample pitch */}
        <div className="mx-auto w-full max-w-xs lg:max-w-none">
          <Pitch formation={getFormation('4-3-3')} placed={DREAM_PLACED} />
          <p className="mt-2 text-center text-[11px] text-[var(--color-muted)]">
            A dream XI — drawn from two decades of club eras
          </p>
        </div>
      </div>

      {/* How to play */}
      <h2 className="sr-only">How to play</h2>
      <ol className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { n: '01', t: 'Roll a club', d: 'A real club from one season — say Arsenal, 2003-04' },
          { n: '02', t: 'Pick & place', d: 'Tap a slot, pick a player. Tap a player to move or swap.' },
          { n: '03', t: 'Simulate', d: `38 games · beat the ${TARGET_POINTS - 1}-point record` },
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
          <Icon name="flag" /> Season challenges{' '}
          <span className="text-[var(--color-accent)]" aria-hidden="true">{showChallenges ? '▴' : '▾'}</span>
        </button>

        {showChallenges && (
          <div className="mt-4 animate-fade-in space-y-3">
            <p className="text-xs text-[var(--color-muted)]">
              Face a real season&apos;s actual table — out-point that year&apos;s champion.
            </p>
            {featured && (
              <button
                data-testid="today-challenge"
                onClick={() => onStart({ mode: 'challenge', seasonId: FEATURED, formationId, daily: true })}
                className="flex w-full items-center justify-between rounded-[var(--radius)] border border-[var(--color-accent-2)] bg-[color-mix(in_srgb,var(--color-accent-2)_10%,transparent)] px-4 py-3 text-left transition-transform hover:-translate-y-0.5"
              >
                <span>
                  <span className="block text-[10px] uppercase tracking-widest text-[var(--color-accent-2-ink)]">
                    Today&apos;s Challenge
                  </span>
                  <span className="font-bold">{featured.label}</span>
                  <span className="block text-[11px] text-[var(--color-muted)]">
                    Man City&apos;s record 100 — the bar you&apos;re chasing
                  </span>
                </span>
                <span className="shrink-0 text-xs text-[var(--color-muted)]">champ {featured.winnerPts}</span>
              </button>
            )}
            <p className="text-[11px] text-[var(--color-muted)]">More seasons coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
