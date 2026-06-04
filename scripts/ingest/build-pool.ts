// Build a single slim "all-time pool" file so main mode loads ONE chunk instead
// of all 22 season files (22 requests / ~240KB gz). Drops standings fields the
// pool never uses; keeps only what a draw source needs (label + squad).
//
// Run: npx tsx scripts/ingest/build-pool.ts  → lib/data/pool.json
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Season, SeasonMeta } from '../../lib/types';

const DIR = join('lib', 'data', 'seasons');
const OUT = join('lib', 'data', 'pool.json');

const short = (id: string) => `${id.split('-')[0].slice(2)}/${id.split('-')[1]}`;

const index = JSON.parse(readFileSync(join(DIR, 'index.json'), 'utf-8')) as SeasonMeta[];
const sources = [];
for (const meta of index) {
  const season = JSON.parse(readFileSync(join(DIR, `${meta.id}.json`), 'utf-8')) as Season;
  const s = short(season.id);
  for (const c of season.clubs) {
    sources.push({
      key: `${season.id}|${c.id}`,
      label: `${c.name} · ${s}`,
      squad: c.squad.map((p) => ({ ...p, club: `${c.name} ${s}` })),
    });
  }
}
writeFileSync(OUT, JSON.stringify(sources));
const players = sources.reduce((n, s) => n + s.squad.length, 0);
console.log(`✓ pool.json: ${sources.length} club-seasons, ${players} players → ${OUT}`);
