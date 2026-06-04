import { describe, it, expect } from 'vitest';
import {
  createRoll,
  roll,
  reroll,
  pick,
  canPick,
  openPositions,
  isComplete,
  lineup,
  REROLLS,
  type RollState,
} from '../lib/engine/rollbuild';
import { simulateSeason } from '../lib/engine/simulate';
import { getSeason, seasonOpponents } from '../lib/data/seasons';
import { getFormation } from '../lib/data/formations';

const SEASON = getSeason('2017-18');

function fresh(formationId = '4-3-3'): RollState {
  return createRoll({ seed: 'test', season: SEASON, formationId });
}

// Drive a whole build: roll, pick first eligible, repeat.
function autoBuild(state: RollState): RollState {
  let s = state;
  let guard = 0;
  while (!isComplete(s) && guard++ < 300) {
    if (!s.drawn) s = roll(s);
    const p = s.drawn!.squad.find((pl) => canPick(s, pl));
    s = p ? pick(s, p.id) : roll(s);
  }
  return s;
}

describe('rollbuild · setup', () => {
  it('starts empty with a full reroll budget', () => {
    const s = fresh();
    expect(s.picks).toHaveLength(0);
    expect(s.drawn).toBeNull();
    expect(s.rerollsLeft).toBe(REROLLS);
    expect(s.clubs.length).toBe(SEASON.clubs.length);
  });

  it('open positions match the formation at the start', () => {
    const open = openPositions(fresh('4-4-2'));
    const slots = getFormation('4-4-2').slots;
    expect(open).toEqual(slots);
  });
});

describe('rollbuild · roll & pick', () => {
  it('roll draws a club with a squad', () => {
    const s = roll(fresh());
    expect(s.drawn).not.toBeNull();
    expect(s.drawn!.squad.length).toBeGreaterThan(10);
    expect(s.drawn!.squad[0].club).toBe(s.drawn!.name);
  });

  it('is deterministic for the same seed', () => {
    expect(roll(fresh()).drawn!.name).toBe(roll(fresh()).drawn!.name);
  });

  it('pick fills a slot, marks taken, and clears the draw', () => {
    const drawn = roll(fresh());
    const player = drawn.drawn!.squad.find((p) => canPick(drawn, p))!;
    const after = pick(drawn, player.id);
    expect(after.picks).toContainEqual(player);
    expect(after.taken.has(player.id)).toBe(true);
    expect(after.drawn).toBeNull();
    expect(openPositions(after)[player.pos]).toBe(
      openPositions(drawn)[player.pos] - 1,
    );
  });

  it('cannot pick a player whose position is already full', () => {
    // fill the single GK slot, then a second GK must be illegal
    let s = roll(fresh());
    const gk1 = s.drawn!.squad.find((p) => p.pos === 'GK')!;
    s = pick(s, gk1.id);
    s = roll(s);
    const gk2 = s.drawn!.squad.find((p) => p.pos === 'GK');
    if (gk2) expect(canPick(s, gk2)).toBe(false);
  });

  it('pick throws when nothing is drawn', () => {
    expect(() => pick(fresh(), 'x')).toThrow();
  });
});

describe('rollbuild · reroll budget', () => {
  it('reroll redraws and decrements the budget', () => {
    const s = reroll(roll(fresh()));
    expect(s.rerollsLeft).toBe(REROLLS - 1);
    expect(s.drawn).not.toBeNull();
  });

  it('reroll is a no-op once the budget is gone', () => {
    let s = roll(fresh());
    for (let i = 0; i < REROLLS; i++) s = reroll(s);
    expect(s.rerollsLeft).toBe(0);
    const blocked = reroll(s);
    expect(blocked.rerollsLeft).toBe(0);
    expect(blocked).toBe(s); // unchanged
  });
});

describe('rollbuild · full build → simulate', () => {
  it('completes a legal XI for the formation', () => {
    const final = autoBuild(fresh('4-3-3'));
    expect(isComplete(final)).toBe(true);
    const xi = lineup(final);
    expect(xi).toHaveLength(11);
    const slots = getFormation('4-3-3').slots;
    for (const pos of ['GK', 'DEF', 'MID', 'FWD'] as const) {
      expect(xi.filter((p) => p.pos === pos).length).toBe(slots[pos]);
    }
    expect(new Set(xi.map((p) => p.id)).size).toBe(11); // no duplicates
  });

  it('the built XI simulates a valid season vs real opponents', () => {
    const xi = lineup(autoBuild(fresh()));
    const r = simulateSeason(xi, {
      seed: 'sim',
      opponents: seasonOpponents(SEASON),
    });
    expect(r.played).toBe(38);
    expect(r.points).toBe(r.won * 3 + r.drawn);
    expect(r.points).toBeLessThanOrEqual(114);
  });
});
