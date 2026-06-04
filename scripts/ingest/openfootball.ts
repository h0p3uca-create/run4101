// Ingest real Premier League season results from openfootball/england (CC0)
// and derive per-club strength (attack/defense 0–100) + tier for the engine.
//
// Run: npx tsx scripts/ingest/openfootball.ts 2017-18
// Source: https://github.com/openfootball/england (Public Domain / CC0)

const RAW = 'https://raw.githubusercontent.com/openfootball/england/master';

interface Standing {
  club: string;
  p: number; w: number; d: number; l: number;
  gf: number; ga: number; pts: number;
}

interface MatchLine {
  home: string; away: string; hg: number; ag: number;
}

// Lines look like:
//   19:45  Arsenal FC               4-3 (2-2)  Leicester City
//          Crystal Palace           0-3 (0-2)  Huddersfield Town
const LINE = /^\s*(?:\d{1,2}[:.]\d{2}\s+)?(.+?)\s{2,}(\d+)-(\d+)(?:\s+\(\d+-\d+\))?\s{2,}(.+?)\s*$/;

function parseMatches(text: string): MatchLine[] {
  const out: MatchLine[] = [];
  for (const line of text.split('\n')) {
    const m = LINE.exec(line);
    if (!m) continue;
    out.push({
      home: m[1].trim(),
      hg: Number(m[2]),
      ag: Number(m[3]),
      away: m[4].trim(),
    });
  }
  return out;
}

function standings(matches: MatchLine[]): Standing[] {
  const table = new Map<string, Standing>();
  const get = (c: string) =>
    table.get(c) ?? table.set(c, { club: c, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }).get(c)!;
  for (const m of matches) {
    const h = get(m.home), a = get(m.away);
    h.p++; a.p++;
    h.gf += m.hg; h.ga += m.ag; a.gf += m.ag; a.ga += m.hg;
    if (m.hg > m.ag) { h.w++; h.pts += 3; a.l++; }
    else if (m.hg < m.ag) { a.w++; a.pts += 3; h.l++; }
    else { h.d++; a.d++; h.pts++; a.pts++; }
  }
  return [...table.values()].sort(
    (x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf,
  );
}

// Map a club's real per-game scoring/conceding into the engine's 0–100 scale.
function toStrength(s: Standing, all: Standing[]) {
  const gfpg = all.map((t) => t.gf / t.p);
  const gapg = all.map((t) => t.ga / t.p);
  const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
  const sd = (a: number[], m: number) =>
    Math.sqrt(mean(a.map((v) => (v - m) ** 2))) || 1;
  const gfM = mean(gfpg), gfS = sd(gfpg, gfM);
  const gaM = mean(gapg), gaS = sd(gapg, gaM);
  const zFor = (s.gf / s.p - gfM) / gfS;
  const zAg = (s.ga / s.p - gaM) / gaS; // higher = leakier
  const clamp = (v: number) => Math.max(40, Math.min(94, Math.round(v)));
  return {
    attack: clamp(66 + zFor * 11),
    defense: clamp(66 - zAg * 11),
  };
}

function tier(pos: number): 'title' | 'europe' | 'mid' | 'relegation' {
  if (pos < 4) return 'title';
  if (pos < 7) return 'europe';
  if (pos < 17) return 'mid';
  return 'relegation';
}

async function main() {
  const season = process.argv[2] ?? '2017-18';
  const url = `${RAW}/${season}/1-premierleague.txt`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  const text = await res.text();
  const matches = parseMatches(text);
  const table = standings(matches);

  if (matches.length < 300) {
    console.warn(`⚠ only ${matches.length} matches parsed (expected 380)`);
  }

  const clubs = table.map((s, i) => ({
    name: s.club,
    pos: i + 1,
    pts: s.pts,
    gf: s.gf,
    ga: s.ga,
    gd: s.gf - s.ga,
    tier: tier(i),
    ...toStrength(s, table),
  }));

  console.log(`── ${season} Premier League (${matches.length} matches) ──`);
  console.log('Pos Club                       Pts  GF  GA   Att Def  Tier');
  for (const c of clubs) {
    console.log(
      `${String(c.pos).padStart(2)}  ${c.name.padEnd(24)} ${String(c.pts).padStart(3)} ` +
        `${String(c.gf).padStart(3)} ${String(c.ga).padStart(3)}   ` +
        `${String(c.attack).padStart(3)} ${String(c.defense).padStart(3)}  ${c.tier}`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
