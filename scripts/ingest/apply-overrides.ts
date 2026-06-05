// Apply curated rating overrides + merge split name formats + expand position
// alternatives, rewriting the season JSONs in place (so BOTH main/era mode and
// challenge mode get them). Idempotent: targets are absolute peaks and the
// position expansion dedups, so re-running is a no-op.
//
// Run: npx tsx scripts/ingest/apply-overrides.ts  (then npm run build:pool)
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Season, SeasonMeta } from '../../lib/types';
import { OVERRIDES, POSITION_OVERRIDES, nameKey, bucketKey, isAbbreviated } from './rating-overrides';

const DIR = join('lib', 'data', 'seasons');
const clamp = (n: number) => Math.max(1, Math.min(99, Math.round(n)));

const index = JSON.parse(readFileSync(join(DIR, 'index.json'), 'utf-8')) as SeasonMeta[];
const seasons = index.map(
  (m) => JSON.parse(readFileSync(join(DIR, `${m.id}.json`), 'utf-8')) as Season,
);

// ── Resolve abbreviated "F. Surname" → unique full name ────────────────────
// Collect the distinct FULL names per initial+surname bucket (from the data and
// from override canonicals). An abbreviation resolves only when its bucket has
// exactly one full name — so "Roy Keane" and a hypothetical "Robbie Keane" stay
// apart, and "A. Sánchez" maps to "Alexis Sánchez" only when he's the lone full.
const bucketFulls = new Map<string, Set<string>>();
const seedFull = (name: string) => {
  if (isAbbreviated(name)) return;
  const b = bucketKey(name);
  const set = bucketFulls.get(b) ?? new Set<string>();
  set.add(name);
  bucketFulls.set(b, set);
};
for (const s of seasons) for (const c of s.clubs) for (const p of c.squad) seedFull(p.name);
for (const { canonical } of OVERRIDES.values()) seedFull(canonical);

function resolveName(name: string): string {
  if (!isAbbreviated(name)) return name;
  const fulls = bucketFulls.get(bucketKey(name));
  return fulls && fulls.size === 1 ? [...fulls][0] : name;
}

// ── 1) Per resolved nameKey: every display variant + the peak rating ───────
const variants = new Map<string, Map<string, number>>(); // key → display name → count
const peak = new Map<string, number>();
for (const s of seasons) {
  for (const c of s.clubs) {
    for (const p of c.squad) {
      const k = nameKey(resolveName(p.name));
      const v = variants.get(k) ?? new Map();
      v.set(p.name, (v.get(p.name) ?? 0) + 1);
      variants.set(k, v);
      peak.set(k, Math.max(peak.get(k) ?? 0, p.rating));
    }
  }
}

// ── 2) Canonical display name per key ──────────────────────────────────────
// override's name if given, else the longest variant (full name beats "F. X").
const canonical = new Map<string, string>();
for (const [k, names] of variants) {
  const ov = OVERRIDES.get(k);
  if (ov) canonical.set(k, ov.canonical);
  else canonical.set(k, [...names.keys()].sort((a, b) => b.length - a.length)[0]);
}

// ── Position expansion ─────────────────────────────────────────────────────
// Adjacent roles that are tactically equivalent — gives versatile players the
// alternative slots the source data omits (Salah RW → also RM, a striker → CF).
const ADJACENT: Record<string, string[]> = {
  ST: ['CF'], CF: ['ST'],
  LW: ['LM'], RW: ['RM'], LM: ['LW'], RM: ['RW'],
  LB: ['LWB'], RB: ['RWB'], LWB: ['LB'], RWB: ['RB'],
  CAM: ['CM'], CDM: ['CM'],
};
const groupFallback = (g: string) =>
  g === 'GK' ? 'GK' : g === 'DEF' ? 'CB' : g === 'MID' ? 'CM' : 'ST';

function expandPositions(key: string, pos: string, current?: string[]): string[] {
  const base = current && current.length ? current : [groupFallback(pos)];
  const out = [...base];
  const add = (code: string) => {
    if (!out.includes(code)) out.push(code);
  };
  for (const code of base) (ADJACENT[code] ?? []).forEach(add);
  (POSITION_OVERRIDES.get(key) ?? []).forEach(add);
  return out;
}

// ── 3) Rewrite every player ────────────────────────────────────────────────
let merged = 0;
let posExpanded = 0;
const appliedKeys = new Set<string>();
for (const s of seasons) {
  for (const c of s.clubs) {
    c.squad = c.squad.map((p) => {
      const k = nameKey(resolveName(p.name));
      const name = canonical.get(k) ?? p.name;
      if (name !== p.name) merged++;
      const positions = expandPositions(k, p.pos, p.positions);
      if ((p.positions?.length ?? 0) !== positions.length) posExpanded++;
      const ov = OVERRIDES.get(k);
      if (!ov) return { ...p, name, positions };
      appliedKeys.add(k);
      const delta = ov.target - (peak.get(k) ?? p.rating);
      return {
        ...p,
        name,
        positions,
        rating: clamp(p.rating + delta),
        att: clamp(p.att + delta),
        def: clamp(p.def + delta),
      };
    });
  }
  writeFileSync(join(DIR, `${s.id}.json`), JSON.stringify(s));
}

// ── 4) Report ──────────────────────────────────────────────────────────────
const unmatched = [...OVERRIDES.entries()].filter(([k]) => !appliedKeys.has(k));
const unmatchedPos = [...POSITION_OVERRIDES.keys()].filter((k) => !variants.has(k));
console.log(`✓ overrides applied: ${appliedKeys.size}/${OVERRIDES.size} players`);
console.log(`✓ name variants normalised: ${merged} entries`);
console.log(`✓ position rows expanded: ${posExpanded} entries`);
if (unmatched.length) {
  console.log(`⚠ rating override NOT FOUND in data (check spelling):`);
  for (const [, v] of unmatched) console.log(`   - ${v.canonical}`);
}
if (unmatchedPos.length) {
  console.log(`⚠ position override NOT FOUND in data: ${unmatchedPos.length} (keys: ${unmatchedPos.join(', ')})`);
}
