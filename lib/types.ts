// ─────────────────────────────────────────────────────────────
// Core domain types for Runfor101
// ─────────────────────────────────────────────────────────────

export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface Player {
  id: string;
  name: string;
  pos: Position;
  /** Attacking contribution 0–100 (finishing, creativity, threat). */
  att: number;
  /** Defensive contribution 0–100 (tackling, positioning, shot-stopping). */
  def: number;
  /** Headline overall 0–100 — also drives draft desirability/order. */
  rating: number;
  /** Era label for flavor, e.g. "1996–2007" (all-time pool only). */
  era?: string;
  /** Real club for this season (season pool only). */
  club?: string;
  /** Specific positions the player can play, FIFA codes e.g. ['LB','LWB']. */
  positions?: string[];
}

// ── Season-based mode (real PL squads + results) ──────────────

export interface SeasonClub {
  id: string;
  name: string;
  pos: number;
  pts: number;
  gf: number;
  ga: number;
  tier: Opponent['tier'];
  attack: number;
  defense: number;
  squad: Player[];
}

export interface Season {
  id: string;
  label: string;
  /** Real champion's points that season — the bar to beat. */
  winnerPts: number;
  /** True when ratings are synthesised (pre-2014 classic seasons). */
  estimated?: boolean;
  clubs: SeasonClub[];
}

export interface SeasonMeta {
  id: string;
  label: string;
  clubs: number;
  players: number;
  winnerPts: number;
  estimated?: boolean;
}

export interface FormationSlots {
  GK: number;
  DEF: number;
  MID: number;
  FWD: number;
}

/** A specific position on the pitch (FIFA code) with layout coordinates. */
export interface Slot {
  id: string; // unique within a formation, e.g. "lb"
  pos: string; // FIFA code: GK, LB, CB, RB, CM, CDM, CAM, LM, RM, LW, RW, ST
  x: number; // 0 (left) – 100 (right)
  y: number; // 0 (attack/top) – 100 (own goal/bottom)
}

export interface Formation {
  id: string; // "4-3-3"
  label: string;
  /** Specific position lineup (drives the pitch + eligibility). */
  lineup: Slot[];
  /** Group counts derived from lineup (back-compat for strength/sim helpers). */
  slots: FormationSlots;
}

/** A league opponent — generic (no real club names/marks). */
export interface Opponent {
  id: string;
  name: string;
  /** 0–100 strength, same scale as team attack/defense. */
  attack: number;
  defense: number;
  tier: 'title' | 'europe' | 'mid' | 'relegation';
}

/** One played fixture from the player's perspective. */
export interface MatchResult {
  opponentId: string;
  opponentName: string;
  home: boolean;
  goalsFor: number;
  goalsAgainst: number;
  outcome: 'W' | 'D' | 'L';
  points: number;
  /** Names of your players who scored, in order (may repeat). */
  scorers: string[];
}

/** Aggregate season outcome for the player's XI. */
export interface SeasonResult {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  matches: MatchResult[];
  /** true when points >= TARGET_POINTS (101). */
  reachedTarget: boolean;
}

/** Derived strength of a selected XI. */
export interface TeamStrength {
  attack: number;
  defense: number;
}
