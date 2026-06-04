'use client';
import type { Player, Position } from '@/lib/types';
import {
  type RollState,
  openPositions,
  canPick,
  isComplete,
  lineup,
} from '@/lib/engine/rollbuild';
import { teamStrength } from '@/lib/engine/ratings';
import { getFormation } from '@/lib/data/formations';
import Pitch from './Pitch';
import BoxScore from './BoxScore';
import { PosBadge, RatingPill } from './PlayerChip';

export default function RollBuild({
  state,
  formationId,
  onRoll,
  onReroll,
  onPick,
  onSimulate,
}: {
  state: RollState;
  formationId: string;
  onRoll: () => void;
  onReroll: () => void;
  onPick: (id: string) => void;
  onSimulate: () => void;
}) {
  const formation = getFormation(formationId);
  const xi = lineup(state);
  const open = openPositions(state);
  const done = isComplete(state);
  const str = teamStrength(state.picks);
  const needLabel = (Object.entries(open) as [Position, number][])
    .filter(([, n]) => n > 0)
    .map(([p]) => p)
    .join('/');

  return (
    <div className="mx-auto grid max-w-6xl gap-5 px-4 py-6 lg:grid-cols-[320px_1fr_270px]">
      {/* Left: roll / draw / pick */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
              {done ? 'Lineup complete' : `${state.picks.length}/11 · ${formation.label}`}
            </p>
            <p className="text-lg font-bold">
              {done ? 'Ready' : needLabel ? `Need: ${needLabel}` : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--color-muted)]">strength</p>
            <p className="font-bold tabular-nums" style={{ fontFamily: 'var(--font-numeral)' }}>
              <span className="text-[var(--color-accent-2)]">{str.attack}</span>
              {' / '}
              <span className="text-[var(--color-accent-3)]">{str.defense}</span>
            </p>
          </div>
        </div>

        {done ? (
          <button
            data-testid="simulate"
            onClick={onSimulate}
            className="w-full rounded-[var(--radius)] bg-[var(--color-accent)] px-6 py-4 text-lg font-black text-[#1a0a1c] transition-transform hover:-translate-y-0.5"
          >
            Simulate the season →
          </button>
        ) : !state.drawn ? (
          <div className="space-y-3 rounded-2xl border border-dashed border-[var(--card-line)] p-6 text-center">
            <p className="text-sm text-[var(--color-muted)]">
              Roll to draw a club from this season
            </p>
            <button
              data-testid="roll"
              onClick={onRoll}
              className="w-full rounded-[var(--radius)] bg-[var(--color-accent-2)] px-6 py-4 text-lg font-black text-white transition-transform hover:-translate-y-0.5"
            >
              ROLL 🎲
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl bg-[var(--card)] p-4 ring-1 ring-[var(--card-line)]">
              <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
                Drawn
              </p>
              <p className="text-2xl font-black">{state.drawn.name}</p>
            </div>

            <button
              data-testid="reroll"
              onClick={onReroll}
              disabled={state.rerollsLeft <= 0}
              className="w-full rounded-[var(--radius)] border border-[var(--card-line)] px-4 py-2 text-sm font-bold transition-colors enabled:hover:border-[var(--color-accent)] disabled:opacity-40"
            >
              ↺ Another club · {state.rerollsLeft} left
            </button>

            <p className="pt-1 text-xs uppercase tracking-widest text-[var(--color-muted)]">
              Pick a player {needLabel && `(${needLabel})`}
            </p>
            <div className="grid max-h-[44vh] grid-cols-1 gap-1.5 overflow-y-auto pr-1">
              {[...state.drawn.squad]
                .sort((a, b) => b.rating - a.rating)
                .map((p) => {
                  const ok = canPick(state, p);
                  return (
                    <button
                      key={p.id}
                      data-testid={`pick-${p.id}`}
                      disabled={!ok}
                      onClick={() => onPick(p.id)}
                      className={`flex items-center gap-2 rounded-[var(--radius)] border px-2 py-1.5 text-left transition-colors ${
                        ok
                          ? 'border-[var(--card-line)] hover:border-[var(--color-accent)] hover:bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] cursor-pointer'
                          : 'border-transparent opacity-30'
                      }`}
                    >
                      <PosBadge pos={p.pos} />
                      <span className="flex-1 truncate text-sm font-medium">{p.name}</span>
                      <RatingPill value={p.rating} />
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Center: pitch */}
      <Pitch formation={formation} xi={xi} />

      {/* Right: box score */}
      <BoxScore formation={formation} picks={state.picks} strength={str} />
    </div>
  );
}
