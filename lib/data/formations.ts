import type { Formation, FormationSlots, Position, Slot } from '../types';

// Map a FIFA position code to its group (for strength/simulation maths).
export function codeGroup(code: string): Position {
  const c = code.toUpperCase();
  if (c === 'GK') return 'GK';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(c)) return 'DEF';
  if (['CM', 'CDM', 'CAM', 'LM', 'RM', 'LDM', 'RDM'].includes(c)) return 'MID';
  return 'FWD';
}

function groupCounts(lineup: Slot[]): FormationSlots {
  const s: FormationSlots = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const slot of lineup) s[codeGroup(slot.pos)]++;
  return s;
}

function build(id: string, label: string, lineup: Slot[]): Formation {
  return { id, label, lineup, slots: groupCounts(lineup) };
}

// y: 0 = attack (top), 100 = own goal (bottom). x: 0 = left, 100 = right.
export const FORMATIONS: Formation[] = [
  build('4-3-3', '4-3-3', [
    { id: 'st', pos: 'ST', x: 50, y: 12 },
    { id: 'lw', pos: 'LW', x: 16, y: 24 },
    { id: 'rw', pos: 'RW', x: 84, y: 24 },
    { id: 'cmL', pos: 'CM', x: 30, y: 48 },
    { id: 'cmC', pos: 'CM', x: 50, y: 54 },
    { id: 'cmR', pos: 'CM', x: 70, y: 48 },
    { id: 'lb', pos: 'LB', x: 14, y: 74 },
    { id: 'cbL', pos: 'CB', x: 38, y: 77 },
    { id: 'cbR', pos: 'CB', x: 62, y: 77 },
    { id: 'rb', pos: 'RB', x: 86, y: 74 },
    { id: 'gk', pos: 'GK', x: 50, y: 92 },
  ]),
  build('4-4-2', '4-4-2', [
    { id: 'stL', pos: 'ST', x: 38, y: 14 },
    { id: 'stR', pos: 'ST', x: 62, y: 14 },
    { id: 'lm', pos: 'LM', x: 14, y: 44 },
    { id: 'cmL', pos: 'CM', x: 38, y: 50 },
    { id: 'cmR', pos: 'CM', x: 62, y: 50 },
    { id: 'rm', pos: 'RM', x: 86, y: 44 },
    { id: 'lb', pos: 'LB', x: 14, y: 74 },
    { id: 'cbL', pos: 'CB', x: 38, y: 77 },
    { id: 'cbR', pos: 'CB', x: 62, y: 77 },
    { id: 'rb', pos: 'RB', x: 86, y: 74 },
    { id: 'gk', pos: 'GK', x: 50, y: 92 },
  ]),
  build('4-2-3-1', '4-2-3-1', [
    { id: 'st', pos: 'ST', x: 50, y: 12 },
    { id: 'lw', pos: 'LW', x: 20, y: 32 },
    { id: 'cam', pos: 'CAM', x: 50, y: 34 },
    { id: 'rw', pos: 'RW', x: 80, y: 32 },
    { id: 'cdmL', pos: 'CDM', x: 38, y: 56 },
    { id: 'cdmR', pos: 'CDM', x: 62, y: 56 },
    { id: 'lb', pos: 'LB', x: 14, y: 76 },
    { id: 'cbL', pos: 'CB', x: 38, y: 78 },
    { id: 'cbR', pos: 'CB', x: 62, y: 78 },
    { id: 'rb', pos: 'RB', x: 86, y: 76 },
    { id: 'gk', pos: 'GK', x: 50, y: 92 },
  ]),
  build('3-5-2', '3-5-2', [
    { id: 'stL', pos: 'ST', x: 38, y: 14 },
    { id: 'stR', pos: 'ST', x: 62, y: 14 },
    { id: 'lm', pos: 'LM', x: 12, y: 42 },
    { id: 'cmL', pos: 'CM', x: 35, y: 50 },
    { id: 'cmC', pos: 'CM', x: 50, y: 54 },
    { id: 'cmR', pos: 'CM', x: 65, y: 50 },
    { id: 'rm', pos: 'RM', x: 88, y: 42 },
    { id: 'cbL', pos: 'CB', x: 30, y: 78 },
    { id: 'cbC', pos: 'CB', x: 50, y: 80 },
    { id: 'cbR', pos: 'CB', x: 70, y: 78 },
    { id: 'gk', pos: 'GK', x: 50, y: 92 },
  ]),
];

export const DEFAULT_FORMATION = FORMATIONS[0];

export function getFormation(id: string): Formation {
  return FORMATIONS.find((f) => f.id === id) ?? DEFAULT_FORMATION;
}
