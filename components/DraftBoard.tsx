'use client';
import { useMemo } from 'react';
import type { Formation, Player, Position } from '@/lib/types';
import {
  type DraftState,
  getUserManager,
  getUserXi,
  legalPicksFor,
  isComplete,
} from '@/lib/engine/draft';
import { getFormation } from '@/lib/data/formations';
import Pitch from './Pitch';
import PlayerPicker from './PlayerPicker';

export interface RivalPick {
  manager: string;
  player: Player;
}

export default function DraftBoard({
  state,
  formationId,
  rivalPicks,
  onPick,
  onSimulate,
}: {
  state: DraftState;
  formationId: string;
  rivalPicks: RivalPick[];
  onPick: (id: string) => void;
  onSimulate: () => void;
}) {
  const formation: Formation = getFormation(formationId);
  const user = getUserManager(state);
  const xi = getUserXi(state);
  const userIdx = state.managers.findIndex((m) => m.isUser);
  const done = isComplete(state);

  const { legalIds, needs } = useMemo(() => {
    const legal = legalPicksFor(state, userIdx);
    const have: Record<Position, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    for (const p of user.picks) have[p.pos]++;
    const needs: Record<Position, number> = {
      GK: formation.slots.GK - have.GK,
      DEF: formation.slots.DEF - have.DEF,
      MID: formation.slots.MID - have.MID,
      FWD: formation.slots.FWD - have.FWD,
    };
    return { legalIds: new Set(legal.map((p) => p.id)), needs };
  }, [state, userIdx, user.picks, formation]);

  const round = Math.floor(state.turn / state.managers.length) + 1;

  return (
    <div className="mx-auto grid max-w-5xl gap-5 px-4 py-6 lg:grid-cols-2">
      {/* Left: pitch + status */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
              {done ? 'Squad complete' : `Round ${Math.min(round, 11)} / 11`}
            </p>
            <p className="text-lg font-bold">
              {user.picks.length}/11 drafted{' '}
              <span className="text-[var(--color-muted)]">· {formation.label}</span>
            </p>
          </div>
          {done && (
            <button
              data-testid="simulate"
              onClick={onSimulate}
              className="rounded-[var(--radius)] bg-[var(--color-accent)] px-5 py-2.5 font-bold text-[#1a0a1c] transition-transform hover:-translate-y-0.5"
            >
              Simulate season →
            </button>
          )}
        </div>

        <Pitch formation={formation} xi={xi} />

        {rivalPicks.length > 0 && (
          <div className="rounded-[var(--radius)] border border-[var(--card-line)] p-2 text-xs">
            <span className="text-[var(--color-muted)]">Rivals just signed: </span>
            {rivalPicks.map((r, i) => (
              <span key={i}>
                <span className="font-semibold text-[var(--color-accent-2)]">
                  {r.player.name}
                </span>
                {i < rivalPicks.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right: picker */}
      <div className="rounded-2xl border border-[var(--card-line)] bg-[var(--card)] p-3">
        {done ? (
          <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 text-center">
            <p className="text-lg font-bold">Your XI is set.</p>
            <button
              data-testid="simulate-panel"
              onClick={onSimulate}
              className="rounded-[var(--radius)] bg-[var(--color-accent)] px-6 py-3 font-bold text-[#1a0a1c]"
            >
              Simulate season →
            </button>
          </div>
        ) : (
          <>
            <p className="mb-2 text-sm font-semibold">
              Your pick{' '}
              <span className="text-[var(--color-muted)]">
                — choose a {Object.entries(needs).filter(([, n]) => n > 0).map(([p]) => p).join('/')}
              </span>
            </p>
            <PlayerPicker
              available={state.pool}
              legalIds={legalIds}
              onPick={onPick}
              needs={needs}
            />
          </>
        )}
      </div>
    </div>
  );
}
