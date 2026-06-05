import type { Position } from '../../../lib/types';

/** Compact player: [name, POS group, rating, FIFA position code(s)]. */
export type P = [string, Position, number, string?];

/** One club's final-table line + squad for a recent season. */
export interface Row {
  id: string;
  name: string;
  pts: number;
  gf: number;
  ga: number;
  squad: P[];
}
