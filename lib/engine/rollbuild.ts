import type { Player, Position, Season } from '../types';
import { getFormation } from '../data/formations';
import { rngFromSeed, type Rng } from './rng';

// ─────────────────────────────────────────────────────────────
// 7a0-style "roll & pick" build (replaces the snake draft).
// ROLL draws a real club from the chosen season; you pick one player from its
// real squad to fill an open position. A small re-roll budget lets you reject a
// draw. No AI rivals — scarcity comes from the random draws + the limited rerolls.
// ─────────────────────────────────────────────────────────────

export const REROLLS = 3;

export interface DrawnClub {
  name: string;
  squad: Player[];
}

export interface RollState {
  seed: string;
  rng: Rng;
  clubs: DrawnClub[];
  slots: Record<Position, number>;
  picks: Player[];
  taken: Set<string>;
  drawn: DrawnClub | null;
  rerollsLeft: number;
  rollCount: number;
}

export function createRoll({
  seed,
  season,
  formationId,
}: {
  seed: string;
  season: Season;
  formationId: string;
}): RollState {
  const clubs: DrawnClub[] = season.clubs.map((c) => ({
    name: c.name,
    squad: c.squad.map((p) => ({ ...p, club: c.name })),
  }));
  return {
    seed,
    rng: rngFromSeed(`roll|${seed}`),
    clubs,
    slots: getFormation(formationId).slots,
    picks: [],
    taken: new Set(),
    drawn: null,
    rerollsLeft: REROLLS,
    rollCount: 0,
  };
}

function counts(picks: Player[]): Record<Position, number> {
  const c: Record<Position, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const p of picks) c[p.pos]++;
  return c;
}

/** Position groups that still need at least one player. */
export function openPositions(state: RollState): Record<Position, number> {
  const have = counts(state.picks);
  return {
    GK: state.slots.GK - have.GK,
    DEF: state.slots.DEF - have.DEF,
    MID: state.slots.MID - have.MID,
    FWD: state.slots.FWD - have.FWD,
  };
}

export function isComplete(state: RollState): boolean {
  return state.picks.length === 11;
}

/** Can this player be picked right now? (position still open, not already taken) */
export function canPick(state: RollState, player: Player): boolean {
  if (state.taken.has(player.id)) return false;
  return openPositions(state)[player.pos] > 0;
}

function drawClub(state: RollState): DrawnClub {
  const idx = Math.floor(state.rng() * state.clubs.length);
  return state.clubs[idx];
}

/** Advance to a fresh draw (used for the next pick). */
export function roll(state: RollState): RollState {
  if (isComplete(state)) return state;
  return { ...state, drawn: drawClub(state), rollCount: state.rollCount + 1 };
}

/** Reject the current draw for a different club (costs one of the budget). */
export function reroll(state: RollState): RollState {
  if (state.rerollsLeft <= 0 || !state.drawn) return state;
  return {
    ...state,
    drawn: drawClub(state),
    rollCount: state.rollCount + 1,
    rerollsLeft: state.rerollsLeft - 1,
  };
}

/** Commit a pick from the current draw; clears the draw so the user rolls next. */
export function pick(state: RollState, playerId: string): RollState {
  if (!state.drawn) throw new Error('Nothing drawn');
  const player = state.drawn.squad.find((p) => p.id === playerId);
  if (!player) throw new Error(`Player not in drawn club: ${playerId}`);
  if (!canPick(state, player)) throw new Error('Cannot pick this player now');
  const taken = new Set(state.taken);
  taken.add(player.id);
  return { ...state, picks: [...state.picks, player], taken, drawn: null };
}

const POS_ORDER: Position[] = ['GK', 'DEF', 'MID', 'FWD'];

/** The selected XI, sorted GK→FWD. */
export function lineup(state: RollState): Player[] {
  return [...state.picks].sort(
    (a, b) => POS_ORDER.indexOf(a.pos) - POS_ORDER.indexOf(b.pos),
  );
}
