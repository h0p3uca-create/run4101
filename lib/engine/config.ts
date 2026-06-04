// Tunable constants for the match engine. Adjust via `npm run calibrate`,
// which Monte-Carlos thousands of seasons and reports the points curve.

/** The dream: beat the 100-point record. */
export const TARGET_POINTS = 101;

export const SEASON = {
  /** 19 opponents × home & away. */
  matchesPerOpponent: 2,
};

/**
 * Poisson goal model (log-linear):
 *   λ_for     = exp( MU + HOME*home + (teamAtt - oppDef) / SCALE )
 *   λ_against = exp( MU            + (oppAtt - teamDef) / SCALE )
 */
export const ENGINE = {
  /** Base log-goals at an even matchup → exp(MU) goals. */
  MU: Math.log(1.4),
  /** Home advantage in log-goals (~+25%). */
  HOME: 0.22,
  /** Strength-difference sensitivity. Smaller = selection matters more. */
  SCALE: 19,
  /** Clamp goals so freak scorelines stay believable. */
  MAX_GOALS: 9,
};

/**
 * Weights mapping an XI's per-position output to team attack / defense.
 * Tuned so a balanced strong XI lands ~85 on each axis.
 */
export const RATING_WEIGHTS = {
  attack: { FWD: 0.5, MID: 0.35, DEF: 0.15 },
  defense: { GK: 0.3, DEF: 0.45, MID: 0.25 },
};
