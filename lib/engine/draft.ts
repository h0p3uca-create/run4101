import type { FormationSlots, Player, Position } from '../types';
import { PLAYERS } from '../data/players';
import { getFormation } from '../data/formations';
import { rngFromSeed, type Rng } from './rng';

// ─────────────────────────────────────────────────────────────
// Snake draft: user + AI managers take turns from a shared, seeded
// board. Scarcity (rivals signing your targets) creates the tension.
// AI managers always build a standard 4-3-3 so any user formation stays
// feasible against the 46-player pool.
// ─────────────────────────────────────────────────────────────

export const AI_QUOTA: FormationSlots = { GK: 1, DEF: 4, MID: 3, FWD: 3 };
const ROUNDS = 11;

export interface Manager {
  id: string;
  name: string;
  isUser: boolean;
  quota: FormationSlots;
  picks: Player[];
}

export interface DraftState {
  seed: string;
  rng: Rng;
  pool: Player[];
  managers: Manager[];
  /** Flattened snake of manager indices; length = managers × 11. */
  order: number[];
  /** Index into `order`. */
  turn: number;
}

const AI_NAMES = ['Rival AI · Red', 'Rival AI · Blue', 'Rival AI · Gold'];

function countByPos(picks: Player[]): Record<Position, number> {
  const c: Record<Position, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const p of picks) c[p.pos]++;
  return c;
}

function snakeOrder(managerCount: number): number[] {
  const order: number[] = [];
  for (let r = 0; r < ROUNDS; r++) {
    const row = Array.from({ length: managerCount }, (_, i) => i);
    if (r % 2 === 1) row.reverse();
    order.push(...row);
  }
  return order;
}

export interface CreateDraftOptions {
  seed: string;
  userFormationId: string;
  aiCount?: number;
  /** Override the draft pool (e.g. a season's squads). Defaults to all-time. */
  pool?: Player[];
}

export function createDraft({
  seed,
  userFormationId,
  aiCount = 2,
  pool = PLAYERS,
}: CreateDraftOptions): DraftState {
  const rng = rngFromSeed(`draft|${seed}`);
  const userFormation = getFormation(userFormationId);

  // Seeded user draft slot (0..managerCount-1) for variety/fairness.
  const managerCount = aiCount + 1;
  const userSlot = Math.floor(rng() * managerCount);

  const managers: Manager[] = [];
  let aiIdx = 0;
  for (let i = 0; i < managerCount; i++) {
    if (i === userSlot) {
      managers.push({
        id: 'user',
        name: 'You',
        isUser: true,
        quota: userFormation.slots,
        picks: [],
      });
    } else {
      managers.push({
        id: `ai-${aiIdx}`,
        name: AI_NAMES[aiIdx % AI_NAMES.length],
        isUser: false,
        quota: { ...AI_QUOTA },
        picks: [],
      });
      aiIdx++;
    }
  }

  return {
    seed,
    rng,
    pool: [...pool],
    managers,
    order: snakeOrder(managerCount),
    turn: 0,
  };
}

export function isComplete(state: DraftState): boolean {
  return state.turn >= state.order.length;
}

export function currentManagerIndex(state: DraftState): number {
  return state.order[state.turn];
}

export function isUserTurn(state: DraftState): boolean {
  if (isComplete(state)) return false;
  return state.managers[currentManagerIndex(state)].isUser;
}

/** Players the given manager may still draft (position quota not full). */
export function legalPicksFor(state: DraftState, managerIdx: number): Player[] {
  const mgr = state.managers[managerIdx];
  const have = countByPos(mgr.picks);
  return state.pool.filter((p) => have[p.pos] < mgr.quota[p.pos]);
}

export function legalPicksForCurrent(state: DraftState): Player[] {
  if (isComplete(state)) return [];
  return legalPicksFor(state, currentManagerIndex(state));
}

/** Commit a pick for the current manager and advance the turn (immutable). */
export function pick(state: DraftState, playerId: string): DraftState {
  if (isComplete(state)) throw new Error('Draft already complete');
  const mgrIdx = currentManagerIndex(state);
  const player = state.pool.find((p) => p.id === playerId);
  if (!player) throw new Error(`Player not in pool: ${playerId}`);

  const mgr = state.managers[mgrIdx];
  const have = countByPos(mgr.picks);
  if (have[player.pos] >= mgr.quota[player.pos]) {
    throw new Error(`${mgr.name} cannot draft another ${player.pos}`);
  }

  const managers = state.managers.map((m, i) =>
    i === mgrIdx ? { ...m, picks: [...m.picks, player] } : m,
  );
  return {
    ...state,
    pool: state.pool.filter((p) => p.id !== playerId),
    managers,
    turn: state.turn + 1,
  };
}

/** AI heuristic: best available for a needed slot, with small seeded noise. */
export function aiPick(state: DraftState): DraftState {
  const legal = legalPicksForCurrent(state);
  if (legal.length === 0) throw new Error('No legal picks for AI');
  let best = legal[0];
  let bestScore = -Infinity;
  for (const p of legal) {
    const score = p.rating + state.rng() * 4;
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return pick(state, best.id);
}

/** Auto-run AI picks until it is the user's turn (or the draft is done). */
export function runUntilUser(state: DraftState): DraftState {
  let s = state;
  while (!isComplete(s) && !isUserTurn(s)) {
    s = aiPick(s);
  }
  return s;
}

export function getUserManager(state: DraftState): Manager {
  return state.managers.find((m) => m.isUser)!;
}

const POS_ORDER: Position[] = ['GK', 'DEF', 'MID', 'FWD'];

/** The user's XI sorted GK→FWD (valid only once their squad is full). */
export function getUserXi(state: DraftState): Player[] {
  return [...getUserManager(state).picks].sort(
    (a, b) => POS_ORDER.indexOf(a.pos) - POS_ORDER.indexOf(b.pos),
  );
}

/** Drive the whole draft with AI logic for every manager (baseline/tests). */
export function autoDraft(state: DraftState): DraftState {
  let s = state;
  while (!isComplete(s)) s = aiPick(s);
  return s;
}
