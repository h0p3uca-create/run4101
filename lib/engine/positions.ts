import type { Player, Slot } from '../types';

// Which player position codes can fill a given slot. A slot accepts its own
// code plus tactically adjacent ones, so versatile players (e.g. CM→CDM/CAM,
// winger→LM/RM) can slide between eligible slots.
const COMPAT: Record<string, string[]> = {
  GK: ['GK'],
  CB: ['CB'],
  LB: ['LB', 'LWB'],
  RB: ['RB', 'RWB'],
  LWB: ['LWB', 'LB'],
  RWB: ['RWB', 'RB'],
  CDM: ['CDM', 'CM'],
  CM: ['CM', 'CDM', 'CAM'],
  CAM: ['CAM', 'CM', 'CF'],
  LM: ['LM', 'LW', 'LWB'],
  RM: ['RM', 'RW', 'RWB'],
  LW: ['LW', 'LM', 'LF'],
  RW: ['RW', 'RM', 'RF'],
  ST: ['ST', 'CF', 'LS', 'RS'],
  CF: ['CF', 'ST', 'CAM'],
};

function playerCodes(p: Player): string[] {
  return p.positions && p.positions.length ? p.positions : [groupFallback(p.pos)];
}

// Fallback when a player has no specific positions (legacy/all-time data).
function groupFallback(group: string): string {
  return group === 'GK' ? 'GK' : group === 'DEF' ? 'CB' : group === 'MID' ? 'CM' : 'ST';
}

/** Can this player play this slot's position? */
export function eligible(player: Player, slot: Slot): boolean {
  const accepted = COMPAT[slot.pos] ?? [slot.pos];
  return playerCodes(player).some((c) => accepted.includes(c));
}

/** How good a fit (0 best) — exact primary match ranks first for auto-placement. */
export function fitRank(player: Player, slot: Slot): number {
  const codes = playerCodes(player);
  if (codes[0] === slot.pos) return 0; // primary position exactly
  if (codes.includes(slot.pos)) return 1; // secondary exact
  return 2; // compatible only
}
