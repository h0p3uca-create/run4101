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
/** A drawn club can't reappear for this many subsequent rolls (recency cooldown). */
export const DRAW_COOLDOWN = 4;
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
  /** Keys of the last few drawn clubs, excluded from the next draw. */
  recent: string[];
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
    recent: [],
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

// How hard the roll leans toward stronger squads. weight = strength^DRAW_BIAS,
// so 0 = uniform; 3 lifts the strongest third's share ~33%→44% (weakest third
// still ~22%), with the best era ~4× as likely as the weakest. "A bit more
// strong sides" without burying the minnows.
export const DRAW_BIAS = 3;

function drawSource(state: RollState): DrawSource {
  // Prefer clubs that actually have a player you can place into an open slot, so
  // every roll is useful (no "drew a club, can't pick anyone" dead ends — matters
  // most for the final scarce position). Falls back to all sources if complete.
  const useful = state.sources.filter((s) => s.squad.some((p) => canPick(state, p)));
  const base = useful.length ? useful : state.sources;
  // Recency cooldown: exclude the last few drawn clubs so the same club doesn't
  // reappear back-to-back. Relax it only if that would leave nothing to draw.
  const fresh = base.filter((s) => !state.recent.includes(s.key));
  const pool = fresh.length ? fresh : base;

  // Strength-weighted draw: stronger squads come up more often (but every club
  // still has a real shot). Falls back to uniform if no strength is present.
  const weight = (s: DrawSource) => (s.strength == null ? 1 : Math.pow(s.strength, DRAW_BIAS));
  const total = pool.reduce((sum, s) => sum + weight(s), 0);
  let r = state.rng() * total;
  for (const s of pool) {
    r -= weight(s);
    if (r <= 0) return s;
  }
  return pool[pool.length - 1];
}

/** Record a freshly drawn club in the recency window (keeps the last DRAW_COOLDOWN). */
function pushRecent(recent: string[], key: string): string[] {
  return [...recent, key].slice(-DRAW_COOLDOWN);
}

export function roll(state: RollState): RollState {
  if (isComplete(state)) return state;
  const drawn = drawSource(state);
  return {
    ...state,
    drawn,
    recent: pushRecent(state.recent, drawn.key),
    rollCount: state.rollCount + 1,
  };
}

export function reroll(state: RollState): RollState {
  if (state.rerollsLeft <= 0 || !state.drawn) return state;
  const drawn = drawSource(state);
  return {
    ...state,
    drawn,
    recent: pushRecent(state.recent, drawn.key),
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

/** Place a drawn player into a SPECIFIC open slot they're eligible for; clears the draw. */
export function pickInto(state: RollState, playerId: string, slotId: string): RollState {
  if (!state.drawn) throw new Error('Nothing drawn');
  const player = state.drawn.squad.find((p) => p.id === playerId);
  if (!player) throw new Error(`Player not in drawn club: ${playerId}`);
  const slot = state.formation.lineup.find((s) => s.id === slotId);
  if (!slot) throw new Error(`Unknown slot: ${slotId}`);
  if (state.placed[slotId]) throw new Error('Slot already filled');
  if (state.takenNames.has(player.name) || !eligible(player, slot)) {
    throw new Error('Cannot place this player here');
  }
  const taken = new Set(state.takenNames);
  taken.add(player.name);
  return {
    ...state,
    placed: { ...state.placed, [slotId]: player },
    takenNames: taken,
    drawn: null,
  };
}

/** Slots (empty or swap-eligible) a placed player can move into. */
export function moveTargets(state: RollState, fromSlotId: string): Slot[] {
  const player = state.placed[fromSlotId];
  const fromSlot = state.formation.lineup.find((s) => s.id === fromSlotId);
  if (!player || !fromSlot) return [];
  return state.formation.lineup.filter((s) => {
    if (s.id === fromSlotId) return false;
    if (!eligible(player, s)) return false;
    const occupant = state.placed[s.id];
    return occupant ? eligible(occupant, fromSlot) : true; // swap must be valid both ways
  });
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
