import type {
  MatchResult,
  Opponent,
  Player,
  SeasonResult,
  TeamStrength,
} from '../types';
import { OPPONENTS } from '../data/opponents';
import { ENGINE, SEASON, TARGET_POINTS } from './config';
import { samplePoisson } from './poisson';
import { teamStrength } from './ratings';
import { rngFromSeed, type Rng } from './rng';

/** Expected goals for one side via the log-linear model. */
function expectedGoals(att: number, oppDef: number, home: boolean): number {
  const lambda = Math.exp(
    ENGINE.MU + (home ? ENGINE.HOME : 0) + (att - oppDef) / ENGINE.SCALE,
  );
  return lambda;
}

// Likelihood a given player scores a goal — forwards finish most, GKs ~never.
function scorerWeight(p: Player): number {
  const base =
    p.pos === 'FWD' ? 1.6 : p.pos === 'MID' ? 1.0 : p.pos === 'DEF' ? 0.25 : 0.01;
  return base * Math.max(1, p.att);
}

function pickScorers(xi: Player[], goals: number, rng: Rng): string[] {
  if (goals <= 0) return [];
  const weights = xi.map(scorerWeight);
  const total = weights.reduce((a, b) => a + b, 0);
  const out: string[] = [];
  for (let g = 0; g < goals; g++) {
    let r = rng() * total;
    let idx = 0;
    for (let i = 0; i < xi.length; i++) {
      r -= weights[i];
      if (r <= 0) { idx = i; break; }
    }
    out.push(xi[idx].name);
  }
  return out;
}

function playMatch(
  xi: Player[],
  team: TeamStrength,
  opp: Opponent,
  home: boolean,
  baseSeed: string,
  matchIdx: number,
): MatchResult {
  const lambdaFor = expectedGoals(team.attack, opp.defense, home);
  const lambdaAgainst = expectedGoals(opp.attack, team.defense, !home);

  // Independent sub-streams per quantity so the variable draw count of one
  // Poisson sample can't shift another's distribution (goals for/against and
  // scorers stay statistically independent).
  const rngFor = rngFromSeed(`${baseSeed}|m${matchIdx}|gf`);
  const rngAgainst = rngFromSeed(`${baseSeed}|m${matchIdx}|ga`);
  const rngScorers = rngFromSeed(`${baseSeed}|m${matchIdx}|sc`);

  const goalsFor = Math.min(samplePoisson(lambdaFor, rngFor), ENGINE.MAX_GOALS);
  const goalsAgainst = Math.min(
    samplePoisson(lambdaAgainst, rngAgainst),
    ENGINE.MAX_GOALS,
  );

  const outcome: MatchResult['outcome'] =
    goalsFor > goalsAgainst ? 'W' : goalsFor < goalsAgainst ? 'L' : 'D';
  const points = outcome === 'W' ? 3 : outcome === 'D' ? 1 : 0;

  return {
    opponentId: opp.id,
    opponentName: opp.name,
    home,
    goalsFor,
    goalsAgainst,
    outcome,
    points,
    scorers: pickScorers(xi, goalsFor, rngScorers),
  };
}

export interface SimulateOptions {
  seed: string;
  opponents?: Opponent[];
}

/**
 * Simulate a full 38-game season for a selected XI.
 * Deterministic given (seed, xi). Throws on an incomplete XI.
 */
export function simulateSeason(
  xi: Player[],
  { seed, opponents = OPPONENTS }: SimulateOptions,
): SeasonResult {
  if (xi.length !== 11) {
    throw new Error(`XI must have exactly 11 players, got ${xi.length}`);
  }

  const team = teamStrength(xi);
  const baseSeed = `${seed}|${xi.map((p) => p.id).join(',')}`;

  const matches: MatchResult[] = [];
  let matchIdx = 0;
  for (let leg = 0; leg < SEASON.matchesPerOpponent; leg++) {
    const home = leg === 0;
    for (const opp of opponents) {
      matches.push(playMatch(xi, team, opp, home, baseSeed, matchIdx++));
    }
  }

  const agg = matches.reduce(
    (a, m) => {
      a.points += m.points;
      a.goalsFor += m.goalsFor;
      a.goalsAgainst += m.goalsAgainst;
      if (m.outcome === 'W') a.won++;
      else if (m.outcome === 'D') a.drawn++;
      else a.lost++;
      return a;
    },
    { points: 0, goalsFor: 0, goalsAgainst: 0, won: 0, drawn: 0, lost: 0 },
  );

  return {
    played: matches.length,
    won: agg.won,
    drawn: agg.drawn,
    lost: agg.lost,
    goalsFor: agg.goalsFor,
    goalsAgainst: agg.goalsAgainst,
    goalDifference: agg.goalsFor - agg.goalsAgainst,
    points: agg.points,
    matches,
    reachedTarget: agg.points >= TARGET_POINTS,
  };
}

/** Aggregate goalscorers across the season, highest first (your Golden Boot). */
export function topScorers(
  result: SeasonResult,
  limit = 3,
): { name: string; goals: number }[] {
  const tally = new Map<string, number>();
  for (const m of result.matches) {
    for (const name of m.scorers) tally.set(name, (tally.get(name) ?? 0) + 1);
  }
  return [...tally.entries()]
    .map(([name, goals]) => ({ name, goals }))
    .sort((a, b) => b.goals - a.goals)
    .slice(0, limit);
}
