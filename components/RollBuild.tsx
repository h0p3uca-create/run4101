'use client';
import { useMemo, useState } from 'react';
import {
  type RollState,
  openSlots,
  eligibleOpenSlots,
  canPick,
  isComplete,
  strengthOf,
  placedCount,
} from '@/lib/engine/rollbuild';
import { eligible } from '@/lib/engine/positions';
import Pitch from './Pitch';
import BoxScore from './BoxScore';

export default function RollBuild({
  state,
  onRoll,
  onReroll,
  onPick,
  onMove,
  onRemove,
  onRestart,
  onSimulate,
}: {
  state: RollState;
  onRoll: () => void;
  onReroll: () => void;
  onPick: (id: string) => void;
  onMove: (fromSlotId: string, toSlotId: string) => void;
  onRemove: (slotId: string) => void;
  onRestart: () => void;
  onSimulate: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const done = isComplete(state);
  // strength + open positions only depend on the placed XI, not on `selected`
  const str = useMemo(() => strengthOf(state), [state.placed, state.formation]);
  const need = useMemo(
    () => [...new Set(openSlots(state).map((s) => s.pos))].join(' · '),
    [state.placed, state.formation],
  );
  const drawnSorted = useMemo(
    () => (state.drawn ? [...state.drawn.squad].sort((a, b) => b.rating - a.rating) : []),
    [state.drawn],
  );

  const highlight = useMemo(() => {
    if (!selected) return [];
    const player = state.placed[selected];
    if (!player) return [];
    return state.formation.lineup
      .filter((s) => s.id !== selected && !state.placed[s.id] && eligible(player, s))
      .map((s) => s.id);
  }, [selected, state]);

  function handleSlotClick(slotId: string) {
    const isPlaced = !!state.placed[slotId];
    if (isPlaced) {
      setSelected((cur) => (cur === slotId ? null : slotId));
    } else if (selected && highlight.includes(slotId)) {
      onMove(selected, slotId);
      setSelected(null);
    } else {
      setSelected(null);
    }
  }

  function handlePick(id: string) {
    onPick(id);
    setSelected(null);
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[300px_1fr_260px]">
      {/* Left: roll / draw / pick */}
      <div className="order-2 space-y-4 lg:order-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
              {done ? 'Lineup complete' : `${placedCount(state)}/11 · ${state.formation.label}`}
            </p>
            <p className="text-sm font-bold">
              {done ? 'Ready' : need ? `Need ${need}` : ''}
            </p>
            {placedCount(state) > 0 && (
              <button
                data-testid="restart"
                onClick={() => { setSelected(null); onRestart(); }}
                className="mt-0.5 text-[10px] uppercase tracking-wider text-[var(--color-muted)] hover:text-[var(--color-accent-2)]"
              >
                ↻ start over
              </button>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">str</p>
            <p className="font-bold tabular-nums" style={{ fontFamily: 'var(--font-numeral)' }}>
              <span className="text-[var(--color-accent-2)]">{str.attack || '–'}</span>
              {' / '}
              <span className="text-[var(--color-accent-3)]">{str.defense || '–'}</span>
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
              {state.mode === 'main'
                ? 'Roll to draw a club from any season'
                : 'Roll to draw a club from this season'}
            </p>
            <button
              data-testid="roll"
              onClick={onRoll}
              className="group w-full rounded-[var(--radius)] bg-[var(--color-accent-2)] px-6 py-4 text-lg font-black text-white transition-transform hover:-translate-y-0.5"
            >
              ROLL <span className="dice">🎲</span>
            </button>
          </div>
        ) : (
          <div key={state.rollCount} className="animate-slide-in space-y-3">
            <div className="rounded-2xl bg-[var(--card)] p-4 ring-1 ring-[var(--card-line)]">
              <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">Drawn</p>
              <p className="text-xl font-black leading-tight">{state.drawn.label}</p>
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
              Pick a player
            </p>
            <div className="max-h-[44vh] overflow-y-auto rounded-[var(--radius)] border border-[var(--card-line)] bg-[var(--card)]">
              {drawnSorted.map((p) => {
                  const ok = canPick(state, p);
                  return (
                    <button
                      key={p.id}
                      data-testid={`pick-${p.id}`}
                      disabled={!ok}
                      onClick={() => handlePick(p.id)}
                      className={`flex w-full items-center gap-3 border-b border-[var(--card-line)] px-3 py-2 text-left transition-colors last:border-0 ${
                        ok
                          ? 'hover:bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] cursor-pointer'
                          : 'opacity-30'
                      }`}
                    >
                      <span className="flex-1 truncate text-sm font-semibold">{p.name}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                        {(p.positions ?? [p.pos]).join('/')}
                      </span>
                      <span
                        className="w-7 text-right text-base font-black tabular-nums"
                        style={{ fontFamily: 'var(--font-numeral)' }}
                      >
                        {p.rating}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Center: the big XI (hero — first on mobile) */}
      <div className="order-1 space-y-2 lg:order-2 lg:border-l lg:border-[var(--card-line)] lg:pl-6">
        <Pitch
          formation={state.formation}
          placed={state.placed}
          selectedSlotId={selected}
          highlightSlotIds={highlight}
          onSlotClick={handleSlotClick}
        />
        {selected && state.placed[selected] ? (
          <div className="flex items-center justify-center gap-2 text-[11px]">
            <span className="font-semibold">{state.placed[selected].name}</span>
            <span className="text-[var(--color-muted)]">— tap a glowing slot to move,</span>
            <button
              data-testid="remove"
              onClick={() => { onRemove(selected); setSelected(null); }}
              className="rounded-full border border-[var(--color-accent-2)] px-2 py-0.5 font-semibold text-[var(--color-accent-2)] hover:bg-[color-mix(in_srgb,var(--color-accent-2)_12%,transparent)]"
            >
              ✕ remove
            </button>
          </div>
        ) : (
          <p className="text-center text-[11px] text-[var(--color-muted)]">
            Tap a placed player to move or remove them
          </p>
        )}
      </div>

      {/* Right: box score */}
      <div className="order-3 lg:border-l lg:border-[var(--card-line)] lg:pl-6">
        <BoxScore formation={state.formation} placed={state.placed} strength={str} />
      </div>
    </div>
  );
}
