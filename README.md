# Runfor101

A Premier League–_inspired_ league simulator. Draft an all-time XI, simulate a
38-game season, and chase the **101-point** record (one better than the real
100-point best).

> No official Premier League marks, club names, or player photos are used.
> Opponents are fictional; player ratings are subjective/derived for gameplay.

## Concept

- **Snake draft** — you and 2 AI managers take turns from a seeded, shared pool.
  Rivals signing your targets creates the squeeze.
- **One-shot season** — fill your formation, hit _Simulate_, get a 38-game
  result table instantly.
- **Daily challenge** — everyone gets the same draft for a given date; share your score.
- **Target: 101 points.** Hard but achievable with an optimal XI and some luck.

## Status

| Phase | Scope | State |
|------|-------|-------|
| 0 | Scaffold (Next.js + TS + Tailwind v4, PL-inspired theme) | ✅ |
| 1 | Data: 78 players, 19 opponents, 4 formations | ✅ |
| 2 | Engine: seeded RNG · Poisson · ratings · season sim · snake draft · tests · calibration | ✅ |
| 3 | UI: draft board + pitch + player picker | ⏳ next |
| 4 | Results: league table, match list, 101 progress, share/seed | ⏳ |
| 5 | SEO + security headers + daily mode | ⏳ |
| 6 | Polish, mobile, deploy | ⏳ |

## Match engine

Goals are Poisson-distributed via a log-linear strength model:

```
λ_for     = exp( MU + HOME·home + (teamAtt − oppDef) / SCALE )
λ_against = exp( MU            + (oppAtt − teamDef) / SCALE )
```

Constants live in `lib/engine/config.ts` and are tuned with `npm run calibrate`.

### Calibration curve (current)

| XI quality | median pts | max | reaches 101 |
|---|---|---|---|
| Random / casual | 79 | 96 | 0% |
| Skilled draft | 86 | 101 | ~0.5% |
| Elite / optimal | 90 | 108 | ~4.3% |

## Develop

```bash
npm install
npm run dev          # local dev server
npm run test         # engine unit tests (vitest)
npm run typecheck    # tsc --noEmit
npm run calibrate    # Monte-Carlo points distribution
npm run build        # static export → ./out
```

## Architecture

```
app/                 Next.js App Router (static export)
lib/types.ts         domain types
lib/data/            players · opponents · formations
lib/engine/          rng · poisson · ratings · simulate · draft · config
scripts/calibrate.ts Monte-Carlo tuning harness
tests/               vitest engine suite
```
