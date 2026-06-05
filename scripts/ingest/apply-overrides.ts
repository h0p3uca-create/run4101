// Apply curated rating overrides + merge split name formats, rewriting the
// season JSONs in place (so BOTH main/era mode and challenge mode get them).
// Idempotent: targets are absolute peaks, so re-running is a no-op.
//
// Run: npx tsx scripts/ingest/apply-overrides.ts  (then npm run build:pool)
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Season, SeasonMeta } from '../../lib/types';
import { OVERRIDES, mergeKey } from './rating-overrides';

const DIR = join('lib', 'data', 'seasons');
const clamp = (n: number) => Math.max(1, Math.min(99, Math.round(n)));

const index = JSON.parse(readFileSync(join(DIR, 'index.json'), 'utf-8')) as SeasonMeta[];
const seasons = index.map(
  (m) => JSON.parse(readFileSync(join(DIR, `${m.id}.json`), 'utf-8')) as Season,
);

// 1) Per merge-key: collect every name variant + the peak rating across all seasons.
const variants = new Map<string, Map<string, number>>(); // key → name → count
const peak = new Map<string, number>();
for (const s of seasons) {
  for (const c of s.clubs) {
    for (const p of c.squad) {
      const k = mergeKey(p.name);
      const v = variants.get(k) ?? new Map();
      v.set(p.name, (v.get(p.name) ?? 0) + 1);
      variants.set(k, v);
      peak.set(k, Math.max(peak.get(k) ?? 0, p.rating));
    }
  }
}

// 2) Canonical display name per key: override's name if given, else the longest
//    variant (full name beats "F. Surname").
const canonical = new Map<string, string>();
for (const [k, names] of variants) {
  const ov = OVERRIDES.get(k);
  if (ov) canonical.set(k, ov.canonical);
  else canonical.set(k, [...names.keys()].sort((a, b) => b.length - a.length)[0]);
}

// 3) Rewrite every player: canonical name + shifted rating/att/def.
let merged = 0;
const appliedKeys = new Set<string>();
for (const s of seasons) {
  for (const c of s.clubs) {
    c.squad = c.squad.map((p) => {
      const k = mergeKey(p.name);
      const name = canonical.get(k) ?? p.name;
      if (name !== p.name) merged++;
      const ov = OVERRIDES.get(k);
      if (!ov) return { ...p, name };
      appliedKeys.add(k);
      const delta = ov.target - (peak.get(k) ?? p.rating);
      return {
        ...p,
        name,
        rating: clamp(p.rating + delta),
        att: clamp(p.att + delta),
        def: clamp(p.def + delta),
      };
    });
  }
  writeFileSync(join(DIR, `${s.id}.json`), JSON.stringify(s));
}

// 4) Report.
const unmatched = [...OVERRIDES.entries()].filter(([k]) => !appliedKeys.has(k));
console.log(`✓ overrides applied: ${appliedKeys.size}/${OVERRIDES.size} players`);
console.log(`✓ name variants normalised: ${merged} entries`);
if (unmatched.length) {
  console.log(`⚠ NOT FOUND in data (check spelling):`);
  for (const [, v] of unmatched) console.log(`   - ${v.canonical}`);
}
