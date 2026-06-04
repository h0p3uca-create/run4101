import type { Formation, Player, Slot, TeamStrength } from '../types';
import type { DrawSource } from '../data/pool';
import { teamStrength } from './ratings';
import { eligible, fitRank } from './positions';
import { rngFromSeed, type Rng } from './rng';

// ─────────────────────────────────────────────────────────────
// Roll & pick onto SPECIFIC position slots.
// ROLL draws a club (challenge: from the season; main: from all PL history).
// Pick a player → auto-placed into the best-fit open slot they're eligible for.
// Placed players can be moved to any other eligible slot. A small reroll budget
// lets you reject a draw. The same person can't appear twice (taken by name).
// ─────────────────────────────────────────────────────────────

export const REROLLS = 3;
export type BuildMode = 'challenge' | 'main';

export interface RollState {
  seed: string;
  rng: Rng;
  mode: BuildMode;
  formation: Formation;
  sources: DrawSource[];
  /** slotId → placed player */
  placed: Record<string, Player>;
  takenNames: Set<string>;
  drawn: DrawSource | null;
  rerollsLeft: number;
  rollCount: number;
}

export function createRoll({
  seed,
  mode,
  formation,
  sources,
}: {
  seed: string;
  mode: BuildMode;
  formation: Formation;
  sources: DrawSource[];
}): RollState {
  return {
    seed,
    rng: rngFromSeed(`roll|${seed}`),
    mode,
    formation,
    sources,
    placed: {},
    takenNames: new Set(),
    drawn: null,
    rerollsLeft: REROLLS,
    rollCount: 0,
  };
}

export function isComplete(state: RollState): boolean {
  return state.formation.lineup.every((s) => state.placed[s.id]);
}

export function openSlots(state: RollState): Slot[] {
  return state.formation.lineup.filter((s) => !state.placed[s.id]);
}

/** Open slots a player is eligible to fill, best fit first. */
export function eligibleOpenSlots(state: RollState, player: Player): Slot[] {
  return openSlots(state)
    .filter((s) => eligible(player, s))
    .sort((a, b) => fitRank(player, a) - fitRank(player, b));
}

export function canPick(state: RollState, player: Player): boolean {
  if (state.takenNames.has(player.name)) return false;
  return eligibleOpenSlots(state, player).length > 0;
}

function drawSource(state: RollState): DrawSource {
  // Prefer clubs that actually have a player you can place into an open slot, so
  // every roll is useful (no "drew a club, can't pick anyone" dead ends — matters
  // most for the final scarce position). Falls back to all sources if complete.
  const useful = state.sources.filter((s) => s.squad.some((p) => canPick(state, p)));
  const pool = useful.length ? useful : state.sources;
  return pool[Math.floor(state.rng() * pool.length)];
}

export function roll(state: RollState): RollState {
  if (isComplete(state)) return state;
  return { ...state, drawn: drawSource(state), rollCount: state.rollCount + 1 };
}

export function reroll(state: RollState): RollState {
  if (state.rerollsLeft <= 0 || !state.drawn) return state;
  return {
    ...state,
    drawn: drawSource(state),
    rollCount: state.rollCount + 1,
    rerollsLeft: state.rerollsLeft - 1,
  };
}

/** Place a drawn player into their best-fit open slot; clears the draw. */
export function pick(state: RollState, playerId: string): RollState {
  if (!state.drawn) throw new Error('Nothing drawn');
  const player = state.drawn.squad.find((p) => p.id === playerId);
  if (!player) throw new Error(`Player not in drawn club: ${playerId}`);
  const slots = eligibleOpenSlots(state, player);
  if (state.takenNames.has(player.name) || slots.length === 0) {
    throw new Error('Cannot place this player');
  }
  const taken = new Set(state.takenNames);
  taken.add(player.name);
  return {
    ...state,
    placed: { ...state.placed, [slots[0].id]: player },
    takenNames: taken,
    drawn: null,
  };
}

/** Move a placed player to another slot they're eligible for (swap if occupied). */
export function moveTo(state: RollState, fromSlotId: string, toSlotId: string): RollState {
  const player = state.placed[fromSlotId];
  const toSlot = state.formation.lineup.find((s) => s.id === toSlotId);
  const fromSlot = state.formation.lineup.find((s) => s.id === fromSlotId);
  if (!player || !toSlot || !fromSlot || fromSlotId === toSlotId) return state;
  if (!eligible(player, toSlot)) return state;

  const occupant = state.placed[toSlotId];
  if (occupant && !eligible(occupant, fromSlot)) return state; // can't swap

  const placed = { ...state.placed };
  placed[toSlotId] = player;
  if (occupant) placed[fromSlotId] = occupant;
  else delete placed[fromSlotId];
  return { ...state, placed };
}

export function removeFrom(state: RollState, slotId: string): RollState {
  const player = state.placed[slotId];
  if (!player) return state;
  const placed = { ...state.placed };
  delete placed[slotId];
  const taken = new Set(state.takenNames);
  taken.delete(player.name);
  return { ...state, placed, takenNames: taken };
}

/** Placed XI in slot (lineup) order. */
export function lineup(state: RollState): Player[] {
  return state.formation.lineup
    .map((s) => state.placed[s.id])
    .filter((p): p is Player => !!p);
}

export function strengthOf(state: RollState): TeamStrength {
  return teamStrength(lineup(state));
}

export function placedCount(state: RollState): number {
  return Object.keys(state.placed).length;
}
