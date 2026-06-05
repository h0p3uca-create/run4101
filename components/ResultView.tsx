'use client';
import { useState } from 'react';
import type { Formation, Player, SeasonResult } from '@/lib/types';
import { TARGET_POINTS } from '@/lib/engine/config';
import { teamStrength } from '@/lib/engine/ratings';
import { topScorers } from '@/lib/engine/simulate';
import Pitch from './Pitch';

/** The real record this game chases — City's 100, with 101 as the target. */
const RECORD_POINTS = 100;

/** A flavour verdict for the season's points haul. */
function verdict(points: number, hit: boolean): { label: string; color: string } {
  if (hit) return { label: 'Record Breakers', color: 'var(--color-accent)' };
  if (points >= 96) return { label: 'Champions', color: 'var(--color-accent)' };
  if (points >= 86) return { label: 'Title Race', color: 'var(--color-accent-3)' };
  if (points >= 75) return { label: 'Top Four', color: 'var(--color-accent-3)' };
  if (points >= 64) return { label: 'Mid-Table', color: 'var(--color-muted)' };
  if (points >= 52) return { label: 'Survival', color: 'var(--color-accent-2)' };
  return { label: 'Relegated', color: 'var(--color-accent-2)' };
}

/** ["Salah","Salah","Aguero"] → "Salah (2), Aguero" */
function summariseScorers(scorers: string[]): string {
  const counts = new Map<string, number>();
  for (const n of scorers) counts.set(n, (counts.get(n) ?? 0) + 1);
  return [...counts.entries()]
    .map(([name, n]) => (n > 1 ? `${name} (${n})` : name))
    .join(', ');
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius)] border border-[var(--card-line)] bg-[var(--card)] px-2 py-3">
      <span
        className="text-2xl font-black tabular-nums leading-none sm:text-3xl"
        style={{ fontFamily: 'var(--font-numeral)', color: accent }}
      >
        {value}
      </span>
      <span className="mt-1 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
    </div>
  );
}

export default function ResultView({
  result,
  xi,
  formation,
  placed,
  seasonLabel,
  winnerPts,
  anonymous = false,
  onReplay,
  onShare,
  shared,
}: {
  result: SeasonResult;
  xi: Player[];
  formation?: Formation;
  placed?: Record<string, Player>;
  seasonLabel: string;
  winnerPts: number;
  anonymous?: boolean;
  onReplay: () => void;
  onShare: () => void;
  shared: boolean;
}) {
  const [showMatches, setShowMatches] = useState(false);
  const str = teamStrength(xi);
  const hit = result.reachedTarget;
  const beatChampion = result.points > winnerPts;
  const scorers = topScorers(result, 3);
  const v = verdict(result.points, hit);

  const pct = Math.min(100, (result.points / TARGET_POINTS) * 100);
  const recordPct = (RECORD_POINTS / TARGET_POINTS) * 100;
  const total = result.won + result.drawn + result.lost || 1;

  const headline = hit
    ? '🏆 Record broken — you reached 101!'
    : result.points >= RECORD_POINTS
      ? `Matched the 100-point mark — ${TARGET_POINTS - result.points} short of the record.`
      : `${TARGET_POINTS - result.points} points short of the 101 record.`;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      {/* ── Hero band ───────────────────────────────────────── */}
      <div
        className={`relative overflow-hidden rounded-2xl border bg-[var(--card)] px-6 py-8 text-center ${
          hit ? 'border-[var(--color-accent)]' : 'border-[var(--card-line)]'
        }`}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(120% 80% at 50% -10%, color-mix(in srgb, ${v.color} ${hit ? 28 : 16}%, transparent), transparent 70%)`,
          }}
        />
        <p className="relative text-[11px] font-bold uppercase tracking-[0.4em] text-[var(--color-muted)]">
          Final standing
        </p>
        <p
          className="relative mt-2 text-2xl font-black uppercase tracking-tight sm:text-3xl"
          style={{ fontFamily: 'var(--font-display)', color: v.color }}
        >
          {v.label}
        </p>
        <div className="relative mt-1 flex items-end justify-center gap-2">
          <span
            className="text-[5.5rem] font-black leading-[0.78] tabular-nums sm:text-[7rem]"
            style={{
              fontFamily: 'var(--font-numeral)',
              color: hit ? 'var(--color-accent)' : 'var(--fg)',
              textShadow: hit
                ? '0 0 36px color-mix(in srgb, var(--color-accent) 55%, transparent)'
                : undefined,
            }}
          >
            {result.points}
          </span>
          <span className="pb-3 text-xl font-bold text-[var(--color-muted)]">pts</span>
        </div>
        <p
          className={`relative mt-1 text-sm font-bold ${
            hit ? 'text-[var(--color-accent)]' : 'text-[var(--color-accent-2)]'
          }`}
        >
          {headline}
        </p>

        {/* progress vs the 100/101 record */}
        <div className="relative mx-auto mt-5 max-w-md">
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--fg)_12%,transparent)]">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: hit ? 'var(--color-accent)' : 'var(--color-accent-3)' }}
            />
          </div>
          <div
            className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-[var(--fg)]"
            style={{ left: `${recordPct}%` }}
            aria-hidden
          />
          <div className="mt-1.5 flex justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
            <span>0</span>
            <span style={{ marginRight: `${100 - recordPct}%` }}>100 record</span>
            <span>{TARGET_POINTS}</span>
          </div>
        </div>

        {!anonymous && (
          <div
            className={`relative mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold ${
              beatChampion
                ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'border-[var(--card-line)] text-[var(--color-muted)]'
            }`}
          >
            {beatChampion ? '🏅' : '○'} {seasonLabel.split('·')[0].trim()} champion: {winnerPts} pts
            <span className="opacity-70">
              {beatChampion
                ? `— beaten by ${result.points - winnerPts}!`
                : `— need ${winnerPts + 1 - result.points} more`}
            </span>
          </div>
        )}
      </div>

      {/* ── Two columns: the XI on a pitch · the numbers ─────── */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* Left — the XI */}
        <div>
          {formation && placed ? (
            <>
              <Pitch formation={formation} placed={placed} />
              <p className="mt-2 text-center text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
                Your XI · {formation.label}
              </p>
            </>
          ) : (
            <div className="rounded-2xl border border-[var(--card-line)] bg-[var(--card)] p-4 text-center text-sm text-[var(--color-muted)]">
              {xi.length} players
            </div>
          )}
        </div>

        {/* Right — the numbers */}
        <div className="flex flex-col gap-4">
          {/* W/D/L shape */}
          <div>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full">
              {result.won > 0 && (
                <div style={{ width: `${(result.won / total) * 100}%`, background: 'var(--color-accent)' }} />
              )}
              {result.drawn > 0 && (
                <div style={{ width: `${(result.drawn / total) * 100}%`, background: 'var(--color-muted)' }} />
              )}
              {result.lost > 0 && (
                <div style={{ width: `${(result.lost / total) * 100}%`, background: 'var(--color-accent-2)' }} />
              )}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <Stat label="Won" value={String(result.won)} accent="var(--color-accent)" />
              <Stat label="Drawn" value={String(result.drawn)} />
              <Stat label="Lost" value={String(result.lost)} accent="var(--color-accent-2)" />
              <Stat label="GF" value={String(result.goalsFor)} />
              <Stat label="GA" value={String(result.goalsAgainst)} />
              <Stat
                label="GD"
                value={`${result.goalDifference >= 0 ? '+' : ''}${result.goalDifference}`}
              />
            </div>
          </div>

          {/* strength */}
          <div className="flex items-center justify-center gap-6 rounded-[var(--radius)] border border-[var(--card-line)] bg-[var(--card)] py-3 text-center">
            <span className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
              Attack{' '}
              <span className="ml-1 text-lg font-black text-[var(--color-accent-2)]" style={{ fontFamily: 'var(--font-numeral)' }}>
                {str.attack}
              </span>
            </span>
            <span className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
              Defense{' '}
              <span className="ml-1 text-lg font-black text-[var(--color-accent-3)]" style={{ fontFamily: 'var(--font-numeral)' }}>
                {str.defense}
              </span>
            </span>
          </div>

          {/* golden boot */}
          {scorers.length > 0 && (
            <div className="rounded-[var(--radius)] border border-[var(--card-line)] bg-[var(--card)] p-4">
              <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--color-muted)]">
                ⚽ Golden Boot
              </p>
              <div className="space-y-2">
                {scorers.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-3">
                    <span className="w-4 text-center text-xs font-black text-[var(--color-muted)]">{i + 1}</span>
                    <span className={`flex-1 truncate text-sm ${i === 0 ? 'font-bold text-[var(--color-accent)]' : 'font-medium'}`}>
                      {i === 0 && '👑 '}
                      {s.name}
                    </span>
                    <span
                      className="rounded-md bg-[color-mix(in_srgb,var(--fg)_8%,transparent)] px-2 py-0.5 text-sm font-black tabular-nums"
                      style={{ fontFamily: 'var(--font-numeral)' }}
                    >
                      {s.goals}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* match list (challenge mode only) */}
      {!anonymous && (
        <button
          onClick={() => setShowMatches((s) => !s)}
          aria-expanded={showMatches}
          className="self-center text-sm font-semibold text-[var(--color-accent-3)] hover:underline"
        >
          {showMatches ? 'Hide' : 'Show'} all 38 results
        </button>
      )}
      {!anonymous && showMatches && (
        <div className="grid max-h-72 grid-cols-1 gap-1 overflow-y-auto rounded-[var(--radius)] border border-[var(--card-line)] bg-[var(--card)] p-2 sm:grid-cols-2">
          {result.matches.map((m, i) => (
            <div key={i} className="rounded px-2 py-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className={`pip-${m.outcome.toLowerCase()} w-3 font-bold`}>{m.outcome}</span>
                  <span className="text-[10px] text-[var(--color-muted)]">{m.home ? 'H' : 'A'}</span>
                  <span className="truncate">{m.opponentName}</span>
                </span>
                <span className="font-semibold tabular-nums" style={{ fontFamily: 'var(--font-numeral)' }}>
                  {m.goalsFor}-{m.goalsAgainst}
                </span>
              </div>
              {m.scorers.length > 0 && (
                <p className="truncate pl-7 text-[10px] text-[var(--color-muted)]">
                  ⚽ {summariseScorers(m.scorers)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={onShare}
          className="flex-1 rounded-[var(--radius)] border border-[var(--card-line)] px-6 py-3 font-bold transition-colors hover:border-[var(--color-accent)]"
        >
          {shared ? '✓ Copied!' : 'Share score'}
        </button>
        <button
          onClick={onReplay}
          className="flex-1 rounded-[var(--radius)] bg-[var(--color-accent)] px-6 py-3 font-bold text-[#1a0a1c] transition-transform hover:-translate-y-0.5"
        >
          Play again
        </button>
      </div>
    </div>
  );
}
