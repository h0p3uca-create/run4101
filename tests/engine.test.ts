import { describe, it, expect } from 'vitest';
import {
  hashSeed,
  rngFromSeed,
  samplePoisson,
  teamStrength,
  simulateSeason,
} from '../lib/engine';
import { PLAYERS, PLAYERS_BY_ID } from './fixtures/players';
import { OPPONENTS } from '../lib/data/opponents';

describe('rng', () => {
  it('is deterministic for a given seed', () => {
    const a = rngFromSeed('x');
    const b = rngFromSeed('x');
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
  it('differs across seeds', () => {
    expect(rngFromSeed('a')()).not.toEqual(rngFromSeed('b')());
    expect(hashSeed('a')).not.toEqual(hashSeed('b'));
  });
});

describe('poisson', () => {
  it('mean approximates lambda over many samples', () => {
    const rng = rngFromSeed('poisson');
    const N = 20000;
    const lambda = 1.8;
    let sum = 0;
    for (let i = 0; i < N; i++) sum += samplePoisson(lambda, rng);
    expect(sum / N).toBeGreaterThan(1.65);
    expect(sum / N).toBeLessThan(1.95);
  });
  it('returns 0 for non-positive lambda', () => {
    expect(samplePoisson(0, rngFromSeed('z'))).toBe(0);
  });
});

describe('teamStrength', () => {
  it('rates a galáctico XI higher than a weak XI on both axes', () => {
    const strongIds = [
      'gk-schmeichel', 'df-vandijk', 'df-ferdinand', 'df-terry', 'df-acole',
      'mf-debruyne', 'mf-gerrard', 'mf-silva', 'fw-henry', 'fw-shearer', 'fw-aguero',
    ];
    const strong = strongIds.map((id) => PLAYERS_BY_ID[id]);
    const weak = [
      PLAYERS_BY_ID['gk-friedel'],
      ...PLAYERS.filter((p) => p.pos === 'DEF').slice(-4),
      ...PLAYERS.filter((p) => p.pos === 'MID').slice(-3),
      ...PLAYERS.filter((p) => p.pos === 'FWD').slice(-3),
    ];
    const s = teamStrength(strong);
    const w = teamStrength(weak);
    expect(s.attack).toBeGreaterThan(w.attack);
    expect(s.defense).toBeGreaterThan(w.defense);
    expect(s.attack).toBeGreaterThan(80);
  });
});

describe('simulateSeason', () => {
  const xi = [
    'gk-schmeichel', 'df-vandijk', 'df-ferdinand', 'df-terry', 'df-acole',
    'mf-debruyne', 'mf-gerrard', 'mf-silva', 'fw-henry', 'fw-shearer', 'fw-aguero',
  ].map((id) => PLAYERS_BY_ID[id]);

  it('plays exactly 38 games with consistent tallies', () => {
    const r = simulateSeason(xi, { seed: 'seed-1' });
    expect(r.played).toBe(38);
    expect(r.won + r.drawn + r.lost).toBe(38);
    expect(r.matches).toHaveLength(38);
    expect(r.points).toBe(r.won * 3 + r.drawn);
    expect(r.goalDifference).toBe(r.goalsFor - r.goalsAgainst);
    expect(r.points).toBeLessThanOrEqual(114);
  });

  it('is deterministic for the same seed + XI', () => {
    const a = simulateSeason(xi, { seed: 's' });
    const b = simulateSeason(xi, { seed: 's' });
    expect(a.points).toBe(b.points);
    expect(a.goalsFor).toBe(b.goalsFor);
  });

  it('plays each opponent home and away', () => {
    const r = simulateSeason(xi, { seed: 's' });
    const home = r.matches.filter((m) => m.home).length;
    expect(home).toBe(OPPONENTS.length);
    expect(r.matches.length - home).toBe(OPPONENTS.length);
  });

  it('throws on an incomplete XI', () => {
    expect(() => simulateSeason(xi.slice(0, 10), { seed: 's' })).toThrow();
  });
});
