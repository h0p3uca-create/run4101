import type { Formation } from '../types';

export const FORMATIONS: Formation[] = [
  { id: '4-3-3', label: '4-3-3', slots: { GK: 1, DEF: 4, MID: 3, FWD: 3 } },
  { id: '4-4-2', label: '4-4-2', slots: { GK: 1, DEF: 4, MID: 4, FWD: 2 } },
  { id: '4-2-3-1', label: '4-2-3-1', slots: { GK: 1, DEF: 4, MID: 5, FWD: 1 } },
  { id: '3-5-2', label: '3-5-2', slots: { GK: 1, DEF: 3, MID: 5, FWD: 2 } },
];

export const DEFAULT_FORMATION = FORMATIONS[0];

export function getFormation(id: string): Formation {
  return FORMATIONS.find((f) => f.id === id) ?? DEFAULT_FORMATION;
}
