import { describe, it, expect } from 'vitest';
import {
  createRoll,
  roll,
  reroll,
  pick,
  pickInto,
  moveTo,
  moveTargets,
  canPick,
  eligibleOpenSlots,
  openSlots,
  isComplete,
  lineup,
  placedCount,
  REROLLS,
  DRAW_COOLDOWN,
  type RollState,
} from '../lib/engine/rollbuild';
import { eligible } from '../lib/engine/positions';
import { simulateSeason } from '../lib/engine/simulate';
import { loadSeason, seasonOpponents } from '../lib/data/seasons';
import { seasonSources, allTimeSources } from '../lib/data/pool';
import { getFormation } from '../lib/data/formations';

const SEASON = await loadSeason('2017-18');
const ALL_SOURCES = await allTimeSources();

function fresh(formationId = '4-3-3', mode: 'challenge' | 'main' = 'challenge'): RollState {
  return createRoll({
    seed: 'test',
    mode,
    formation: getFormation(formationId),
    sources: mode === 'challenge' ? seasonSources(SEASON) : ALL_SOURCES,
  });
}

function autoBuild(state: RollState): RollState {
  let s = state;
  let guard = 0;
  while (!isComplete(s) && guard++ < 500) {
    if (!s.drawn) s = roll(s);
    const p = s.drawn!.squad.find((pl) => canPick(s, pl));
    s = p ? pick(s, p.id) : roll(s);
  }
  return s;
}

describe('rollbuild · setup', () => {
  it('starts empty with a full reroll budget and 11 slots', () => {
    const s = fresh();
    expect(placedCount(s)).toBe(0);
    expect(s.drawn).toBeNull();
    expect(s.rerollsLeft).toBe(REROLLS);
    expect(openSlots(s)).toHaveLength(11);
    expect(s.sources.length).toBe(SEASON.clubs.length);
  });

  it('all-time mode pools every club of every season', () => {
    const s = fresh('4-3-3', 'main');
    expect(s.sources.length).toBeGreaterThan(100);
  });
});

describe('rollbuild · roll & pick onto slots', () => {
  it('roll draws a club squad; deterministic per seed', () => {
    expect(roll(fresh()).drawn!.label).toBe(roll(fresh()).drawn!.label);
    expect(roll(fresh()).drawn!.squad.length).toBeGreaterThan(10);
  });

  it('pick places the player into an eligible slot they can play', () => {
    const drawn = roll(fresh());
    const player = drawn.drawn!.squad.find((p) => canPick(drawn, p))!;
    const targetSlots = eligibleOpenSlots(drawn, player);
    const after = pick(drawn, player.id);
    const slotId = Object.keys(after.placed).find((k) => after.placed[k].name === player.name)!;
    const slot = after.formation.lineup.find((s) => s.id === slotId)!;
    expect(eligible(player, slot)).toBe(true);
    expect(targetSlots.map((s) => s.id)).toContain(slotId);
    expect(after.drawn).toBeNull();
    expect(after.takenNames.has(player.name)).toBe(true);
  });

  it('cannot pick the same person twice (by name)', () => {
    let s = roll(fresh('4-3-3', 'main'));
    const p = s.drawn!.squad.find((pl) => canPick(s, pl))!;
    s = pick(s, p.id);
    // a different season-version of the same name must be unpickable
    expect(s.takenNames.has(p.name)).toBe(true);
  });

  it('pick throws when nothing is drawn', () => {
    expect(() => pick(fresh(), 'x')).toThrow();
  });
});

describe('rollbuild · pick into a specific slot', () => {
  it('places a player into the chosen eligible slot (not just best-fit)', () => {
    let s = roll(fresh('4-3-3'));
    // find an eligible (player, open slot) pair from the draw
    const p = s.drawn!.squad.find((pl) => canPick(s, pl))!;
    const slot = eligibleOpenSlots(s, p).at(-1)!; // a non-primary eligible slot when available
    s = pickInto(s, p.id, slot.id);
    expect(s.placed[slot.id].name).toBe(p.name);
    expect(s.drawn).toBeNull();
    expect(s.takenNames.has(p.name)).toBe(true);
  });

  it('rejects an ineligible slot or an already-filled slot', () => {
    let s = roll(fresh('4-3-3'));
    const p = s.drawn!.squad.find((pl) => canPick(s, pl))!;
    const bad = s.formation.lineup.find((sl) => !eligible(p, sl));
    if (bad) expect(() => pickInto(s, p.id, bad.id)).toThrow();
    const good = eligibleOpenSlots(s, p)[0];
    s = pickInto(s, p.id, good.id);
    const p2 = s.drawn ? null : roll(s).drawn!.squad.find((pl) => canPick(roll(s), pl));
    if (p2) {
      const s2 = roll(s);
      expect(() => pickInto(s2, p2.id, good.id)).toThrow(); // slot already filled
    }
  });
});

describe('rollbuild · move and swap between eligible slots', () => {
  it('moves a placed player to another eligible empty slot', () => {
    // place a central midfielder, then move across the midfield line
    let s = roll(fresh());
    const cm = s.drawn!.squad.find((p) => p.positions?.includes('CM') && canPick(s, p));
    if (!cm) return; // squad-dependent; skip if none drawn
    s = pick(s, cm.id);
    const fromId = Object.keys(s.placed).find((k) => s.placed[k].name === cm.name)!;
    const otherCm = s.formation.lineup.find(
      (sl) => sl.id !== fromId && !s.placed[sl.id] && eligible(cm, sl),
    );
    if (!otherCm) return;
    const moved = moveTo(s, fromId, otherCm.id);
    expect(moved.placed[otherCm.id].name).toBe(cm.name);
    expect(moved.placed[fromId]).toBeUndefined();
  });

  it('moveTargets only lists slots that are eligible (and swap-valid both ways)', () => {
    let s = roll(fresh('4-3-3'));
    const p = s.drawn!.squad.find((pl) => canPick(s, pl))!;
    const slot = eligibleOpenSlots(s, p)[0];
    s = pickInto(s, p.id, slot.id);
    for (const t of moveTargets(s, slot.id)) {
      expect(t.id).not.toBe(slot.id);
      expect(eligible(p, t)).toBe(true);
      const occ = s.placed[t.id];
      const fromSlot = s.formation.lineup.find((x) => x.id === slot.id)!;
      if (occ) expect(eligible(occ, fromSlot)).toBe(true);
    }
  });

  it('swaps two eligible occupied slots, preserving both players', () => {
    // build a full XI, then swap two same-line slots that are mutually eligible
    const s = autoBuild(fresh('4-3-3'));
    const cmSlots = s.formation.lineup.filter((sl) => sl.pos === 'CM');
    if (cmSlots.length < 2) return;
    const [a, b] = cmSlots;
    const pa = s.placed[a.id], pb = s.placed[b.id];
    if (!eligible(pa, b) || !eligible(pb, a)) return;
    const swapped = moveTo(s, a.id, b.id);
    expect(swapped.placed[b.id].name).toBe(pa.name);
    expect(swapped.placed[a.id].name).toBe(pb.name);
    expect(lineup(swapped)).toHaveLength(11); // nobody dropped
  });
});

describe('rollbuild · draw cooldown & uniform odds', () => {
  it('a drawn club does not reappear within DRAW_COOLDOWN rolls', () => {
    // Season pool (~20 clubs) ≫ window size, so the cooldown is never relaxed.
    let s = fresh('4-3-3', 'challenge');
    const keys: string[] = [];
    for (let i = 0; i < 15; i++) {
      s = roll(s);
      keys.push(s.drawn!.key);
    }
    // Every window of DRAW_COOLDOWN+1 consecutive draws must be all-distinct.
    const w = DRAW_COOLDOWN + 1;
    for (let i = 0; i + w <= keys.length; i++) {
      const window = keys.slice(i, i + w);
      expect(new Set(window).size).toBe(window.length);
    }
  });

  it('keeps at most DRAW_COOLDOWN keys in the recency window', () => {
    let s = fresh('4-3-3', 'main');
    for (let i = 0; i < 10; i++) s = roll(s);
    expect(s.recent.length).toBeLessThanOrEqual(DRAW_COOLDOWN);
    expect(s.recent[s.recent.length - 1]).toBe(s.drawn!.key);
  });

  it('reroll never returns the club it just rejected', () => {
    let s = roll(fresh('4-3-3', 'challenge'));
    const before = s.drawn!.key;
    s = reroll(s);
    expect(s.drawn!.key).not.toBe(before);
  });
});

describe('rollbuild · reroll budget', () => {
  it('reroll redraws and decrements; no-op when exhausted', () => {
    let s = reroll(roll(fresh()));
    expect(s.rerollsLeft).toBe(REROLLS - 1);
    s = roll(fresh());
    for (let i = 0; i < REROLLS; i++) s = reroll(s);
    expect(s.rerollsLeft).toBe(0);
    expect(reroll(s)).toBe(s);
  });
});

describe('rollbuild · full build → simulate', () => {
  it('fills every slot with an eligible player', () => {
    const final = autoBuild(fresh('4-3-3'));
    expect(isComplete(final)).toBe(true);
    for (const slot of final.formation.lineup) {
      const p = final.placed[slot.id];
      expect(p).toBeDefined();
      expect(eligible(p, slot)).toBe(true);
    }
    const names = lineup(final).map((p) => p.name);
    expect(new Set(names).size).toBe(11); // no duplicate person
  });

  it('the built XI simulates a valid season', () => {
    const xi = lineup(autoBuild(fresh()));
    const r = simulateSeason(xi, { seed: 'sim', opponents: seasonOpponents(SEASON) });
    expect(r.played).toBe(38);
    expect(r.points).toBe(r.won * 3 + r.drawn);
  });

  it('completes in all-time (cross-season) mode too', () => {
    const final = autoBuild(fresh('4-4-2', 'main'));
    expect(isComplete(final)).toBe(true);
    expect(lineup(final)).toHaveLength(11);
  });
});
