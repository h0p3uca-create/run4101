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

function playMatch(
  team: TeamStrength,
  opp: Opponent,
  home: boolean,
  rng: Rng,
): MatchResult {
  const lambdaFor = expectedGoals(team.attack, opp.defense, home);
  const lambdaAgainst = expectedGoals(opp.attack, team.defense, !home);

  const goalsFor = Math.min(samplePoisson(lambdaFor, rng), ENGINE.MAX_GOALS);
  const goalsAgainst = Math.min(
    samplePoisson(lambdaAgainst, rng),
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
  const rng = rngFromSeed(`${seed}|${xi.map((p) => p.id).join(',')}`);

  const matches: MatchResult[] = [];
  for (let leg = 0; leg < SEASON.matchesPerOpponent; leg++) {
    const home = leg === 0;
    for (const opp of opponents) {
      matches.push(playMatch(team, opp, home, rng));
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
