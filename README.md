# Runfor101

A Premier League–_inspired_ squad-building game. **Roll** a real club from a
given era, **build** a dream XI from the players who actually played there,
**simulate** a 38-game season, and chase the **101-point** record — one better
than the real 100-point best.

> No official Premier League marks, club crests, or player photos are used.
> Opponents are fictional. Player ratings are derived from public FIFA/EA
> attributes (CC BY-NC-SA); match results from openfootball/england (CC0).
> Names are used descriptively under fair use. Non-commercial fan project.

## Concept

- **Roll → pick → place.** Each roll draws a strength-weighted real club/era.
  Pick one eligible player into an open formation slot, then roll again. A drawn
  club can't reappear for 4 rolls, so the pool keeps moving.
- **Build any formation.** 4-3-3, 4-4-2, 4-2-3-1, 3-5-2. Players slot into
  tactically-compatible positions (a winger can cover the opposite flank or ST).
- **One-shot season.** Fill all 11, hit _Simulate_, get a 38-game result table
  instantly — points, W/D/L, goals, golden boot, match-by-match.
- **Target: 101 points.** Hard but achievable. A globally-optimal XI reaches it
  in ~13% of seasons; a casual build, ~0%. It takes both a great XI and luck.
- **Today's Challenge.** A featured real season (currently Man City's 2017-18
  Centurions) — out-point that year's actual champion.

## Match engine

Goals are Poisson-distributed via a log-linear strength model:

```
λ_for     = exp( MU + HOME·home + (teamAtt − oppDef) / SCALE )
λ_against = exp( MU            + (oppAtt − teamDef) / SCALE )
```

Team strength is star-weighted (a few elites move the needle more than a flat
average). Constants live in `lib/engine/config.ts`. Opponent strength and the
era-pool boost are tuned together so 101 stays rare — re-tune with
`npm run calibrate:eras`, then verify with `npm run audit`.

### Balance (current, era pool)

| XI quality | median pts | reaches 101 |
|---|---|---|
| Random / casual | 71 | 0% |
| Greedy (best each roll) | 81 | 0% |
| Selective (hunts elites) | 87 | 0% |
| Global-optimal | 95 | ~13% |

## Data pipeline

The player pool is built from per-season squad data (`lib/data/seasons/*.json`,
~25 seasons, 2000-01 → 2025-26) collapsed into ~5-year club **eras**. Curated
rating overrides (`scripts/ingest/rating-overrides.ts`) hand-tune ~90 players
the source data gets wrong, and expand position alternatives for versatile
attackers. Re-run after any data/override change:

```bash
npm run apply-overrides   # apply curated ratings + positions to season JSONs
npm run build:pool        # collapse seasons → era pool (lib/data/pool.json)
npm run calibrate:eras    # re-tune opponent boost to keep ~13% optimal-hit
npm run audit             # sanity-check balance, scorelines, cooldown
```

## Develop

```bash
npm install
npm run dev          # local dev server (pinned to --webpack, see next.config.mjs)
npm run test         # engine + rollbuild unit tests (vitest)
npm run typecheck    # tsc --noEmit
npm run build        # static export → ./out (pinned to --webpack)
```

> **Build note:** dev and build are pinned to `--webpack`. Next 16 Turbopack
> currently fails to collect metadata routes (robots.txt/sitemap.xml) under
> `output: 'export'` and intermittently 500s on `next/font/google` in dev.
> See `next.config.mjs` for details.

## Architecture

```
app/                    Next.js App Router (static export) · layout · OG image · robots · sitemap
components/             Game (useReducer) · SetupScreen · RollBuild · ResultView · Pitch · ShareCard
lib/types.ts            domain types
lib/data/               seasons/*.json · pool.json · opponents · formations · seasons index
lib/engine/             rng · poisson · ratings · simulate · rollbuild · positions · config
scripts/ingest/         build-era-pool · apply-overrides · rating-overrides · calibrate-eras · audit
tests/                  vitest engine + rollbuild suites
```
