'use client';
import { useMemo, useState } from 'react';
import {
  type RollState,
  openSlots,
  eligibleOpenSlots,
  moveTargets as moveTargetsFor,
  canPick,
  isComplete,
  strengthOf,
  placedCount,
} from '@/lib/engine/rollbuild';
import { eligible } from '@/lib/engine/positions';
import { posColor } from '@/lib/ui';
import Pitch from './Pitch';
import BoxScore from './BoxScore';
import RatingBadge from './RatingBadge';
import Icon from './Icon';

export default function RollBuild({
  state,
  onRoll,
  onReroll,
  onPick,
  onPickInto,
  onMove,
  onRemove,
  onRestart,
  onSimulate,
}: {
  state: RollState;
  onRoll: () => void;
  onReroll: () => void;
  onPick: (id: string) => void;
  onPickInto: (id: string, slotId: string) => void;
  onMove: (fromSlotId: string, toSlotId: string) => void;
  onRemove: (slotId: string) => void;
  onRestart: () => void;
  onSimulate: () => void;
}) {
  // Two mutually-exclusive selections:
  //  - `selected`  : a PLACED player chosen to move / swap / remove
  //  - `targetSlot`: an EMPTY slot chosen to fill from the draw (slot-first pick)
  const [selected, setSelected] = useState<string | null>(null);
  const [targetSlot, setTargetSlot] = useState<string | null>(null);
  const done = isComplete(state);
  // strength + open positions only depend on the placed XI, not on selection
  const str = useMemo(() => strengthOf(state), [state.placed, state.formation]);
  const need = useMemo(
    () => [...new Set(openSlots(state).map((s) => s.pos))].join(' · '),
    [state.placed, state.formation],
  );

  // The targeted empty slot, resolved to its Slot (cleared once it's no longer open).
  const targetSlotObj = useMemo(
    () =>
      targetSlot
        ? state.formation.lineup.find((s) => s.id === targetSlot && !state.placed[s.id]) ?? null
        : null,
    [targetSlot, state.formation, state.placed],
  );

  // Drawn squad, best first. When a slot is targeted, eligible-for-that-slot players float up.
  const drawnSorted = useMemo(() => {
    if (!state.drawn) return [];
    const squad = [...state.drawn.squad];
    if (targetSlotObj) {
      return squad.sort((a, b) => {
        const ea = eligible(a, targetSlotObj) ? 0 : 1;
        const eb = eligible(b, targetSlotObj) ? 0 : 1;
        return ea - eb || b.rating - a.rating;
      });
    }
    return squad.sort((a, b) => b.rating - a.rating);
  }, [state.drawn, targetSlotObj]);

  // Empty + swap-eligible slots the selected placed player can move into.
  const highlight = useMemo(
    () => (selected ? moveTargetsFor(state, selected).map((s) => s.id) : []),
    [selected, state],
  );

  function handleSlotClick(slotId: string) {
    const clickedPlayer = state.placed[slotId];

    // A placed player is selected → resolve the click against it.
    if (selected) {
      if (slotId === selected) { setSelected(null); return; }        // tap self → deselect
      if (highlight.includes(slotId)) { onMove(selected, slotId); setSelected(null); return; }
      // not a valid move/swap target: reselect a placed player, else clear
      if (clickedPlayer) { setSelected(slotId); setTargetSlot(null); }
      else { setSelected(null); }
      return;
    }

    // Nothing selected.
    if (clickedPlayer) {
      setSelected(slotId);          // pick a placed player to move/swap/remove
      setTargetSlot(null);
    } else {
      setTargetSlot((cur) => (cur === slotId ? null : slotId)); // target an empty slot
    }
  }

  // Picking from the draw: into the targeted slot if one is set, else best-fit.
  function handlePick(id: string) {
    if (targetSlotObj) onPickInto(id, targetSlotObj.id);
    else onPick(id);
    setSelected(null);
    setTargetSlot(null);
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-2 lg:grid-cols-[300px_1fr_260px]">
      <h1 className="sr-only">Build your XI</h1>
      {/* Left: roll / draw / pick — leads on mobile so ROLL is never below the fold */}
      <div className="order-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
              {done ? 'XI complete' : `${placedCount(state)}/11 · ${state.formation.label}`}
            </p>
            <p className="text-sm font-bold">
              {done ? 'Ready' : need ? `Need ${need}` : ''}
            </p>
            {placedCount(state) > 0 && (
              <button
                data-testid="restart"
                onClick={() => { setSelected(null); onRestart(); }}
                className="inline-flex min-h-[36px] items-center text-[10px] uppercase tracking-wider text-[var(--color-muted)] hover:text-[var(--color-accent-2)]"
              >
                <span aria-hidden="true">↻</span>&nbsp;start over
              </button>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Strength</p>
            <p className="font-bold tabular-nums" style={{ fontFamily: 'var(--font-numeral)' }}>
              <span className="text-[var(--color-accent-2-ink)]" aria-label={`Attack ${str.attack || 0}`}>
                {str.attack || '–'}
              </span>
              <span aria-hidden="true"> / </span>
              <span className="text-[var(--color-accent-3)]" aria-label={`Defense ${str.defense || 0}`}>
                {str.defense || '–'}
              </span>
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
                ? 'Roll to draw a club era from any decade'
                : 'Roll to draw a club from this season'}
            </p>
            <button
              data-testid="roll"
              onClick={onRoll}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--color-accent-2)] px-6 py-4 text-lg font-black text-white transition-transform hover:-translate-y-0.5"
            >
              ROLL <span className="dice"><Icon name="dice" /></span>
            </button>
          </div>
        ) : (
          <div key={state.rollCount} className="animate-slide-in space-y-3">
            {(() => {
              const [club, era] = state.drawn!.label.split(' · ');
              return (
                <div className="relative overflow-hidden rounded-2xl bg-[var(--card)] p-4 pl-5 ring-1 ring-[var(--card-line)]">
                  <span
                    className="absolute inset-y-0 left-0 w-1.5"
                    style={{ background: 'var(--color-accent-2)' }}
                  />
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-muted)]">
                    You drew
                  </p>
                  <p className="mt-0.5 text-2xl font-black leading-none">{club}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {era && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-black tabular-nums text-[var(--color-accent-2-ink)] ring-1 ring-[var(--color-accent-2)]"
                        style={{ fontFamily: 'var(--font-numeral)' }}
                      >
                        {era}
                      </span>
                    )}
                    <span className="text-[11px] text-[var(--color-muted)]">
                      {state.drawn!.squad.length} players
                    </span>
                  </div>
                </div>
              );
            })()}
            <button
              data-testid="reroll"
              onClick={onReroll}
              disabled={state.rerollsLeft <= 0}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[var(--card-line)] px-4 py-2 text-sm font-bold transition-colors enabled:hover:border-[var(--color-accent)] disabled:opacity-40"
            >
              <Icon name="refresh" /> Reroll · {state.rerollsLeft} left
            </button>
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
                {targetSlotObj ? `Pick a ${targetSlotObj.pos}` : 'Pick a player'}
              </p>
              {targetSlotObj && (
                <button
                  data-testid="clear-target"
                  onClick={() => setTargetSlot(null)}
                  className="inline-flex min-h-[32px] items-center text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)] hover:underline"
                >
                  <span aria-hidden="true">✕</span>&nbsp;clear slot
                </button>
              )}
            </div>
            <div className="max-h-[44vh] overflow-y-auto rounded-[var(--radius)] border border-[var(--card-line)] bg-[var(--card)]">
              {drawnSorted.map((p) => {
                  // When a slot is targeted, only players eligible for *that* slot are pickable.
                  const ok = targetSlotObj
                    ? !state.takenNames.has(p.name) && eligible(p, targetSlotObj)
                    : canPick(state, p);
                  return (
                    <button
                      key={p.id}
                      data-testid={`pick-${p.id}`}
                      disabled={!ok}
                      onClick={() => handlePick(p.id)}
                      className={`flex w-full items-center gap-2.5 border-b border-[var(--card-line)] py-2 pl-2 pr-3 text-left transition-colors last:border-0 ${
                        ok
                          ? 'cursor-pointer hover:bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)]'
                          : 'opacity-30'
                      }`}
                    >
                      <span
                        className="h-8 w-1 shrink-0 rounded-full"
                        style={{ background: posColor(p.pos) }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold leading-tight">{p.name}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                          {(p.positions ?? [p.pos]).join(' / ')}
                        </span>
                      </span>
                      <RatingBadge rating={p.rating} size="sm" />
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Center: the big XI */}
      <div className="order-2 space-y-2 lg:border-l lg:border-[var(--card-line)] lg:pl-6">
        <Pitch
          formation={state.formation}
          placed={state.placed}
          selectedSlotId={selected}
          targetSlotId={targetSlotObj?.id ?? null}
          highlightSlotIds={highlight}
          onSlotClick={handleSlotClick}
        />
        {selected && state.placed[selected] ? (
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px]">
            <span className="font-semibold">{state.placed[selected].name} selected</span>
            <span className="text-[var(--color-muted)]">— tap a glowing slot to move or swap, or</span>
            <button
              data-testid="remove"
              onClick={() => { onRemove(selected); setSelected(null); }}
              className="inline-flex min-h-[36px] items-center rounded-full border border-[var(--color-accent-2)] px-3 font-semibold text-[var(--color-accent-2)] hover:bg-[color-mix(in_srgb,var(--color-accent-2)_12%,transparent)]"
            >
              <span aria-hidden="true">✕</span>&nbsp;remove
            </button>
          </div>
        ) : targetSlotObj ? (
          <p className="text-center text-[11px] text-[var(--color-muted)]">
            <span className="font-semibold text-[var(--fg)]">{targetSlotObj.pos}</span> selected —
            pick an eligible player from the draw
          </p>
        ) : (
          <p className="text-center text-[11px] text-[var(--color-muted)]">
            Tap an empty slot to pick for it, or a placed player to move, swap or remove
          </p>
        )}
      </div>

      {/* Right: box score */}
      <div className="order-3 md:col-span-2 lg:col-span-1 lg:border-l lg:border-[var(--card-line)] lg:pl-6">
        <BoxScore formation={state.formation} placed={state.placed} strength={str} />
      </div>
    </div>
  );
}
