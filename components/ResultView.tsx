'use client';
import { useState } from 'react';
import type { Player, Position, SeasonResult } from '@/lib/types';
import { TARGET_POINTS } from '@/lib/engine/config';
import { teamStrength } from '@/lib/engine/ratings';
import { topScorers } from '@/lib/engine/simulate';
import { posColor } from '@/lib/ui';
import RatingBadge from './RatingBadge';

/** The real record this game chases — City's 100, with 101 as the target. */
const RECORD_POINTS = 100;

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
    <div className="flex flex-col items-center rounded-[var(--radius)] border border-[var(--card-line)] bg-[var(--card)] px-2 py-3">
      <span
        className="text-2xl font-black tabular-nums"
        style={{ fontFamily: 'var(--font-numeral)', color: accent }}
      >
        {value}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">{label}</span>
    </div>
  );
}

const POS_ORDER: { pos: Position; label: string }[] = [
  { pos: 'GK', label: 'Keeper' },
  { pos: 'DEF', label: 'Defence' },
  { pos: 'MID', label: 'Midfield' },
  { pos: 'FWD', label: 'Attack' },
];

/** A compact teamsheet of the XI that produced this season. */
function TeamSheet({ xi }: { xi: Player[] }) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--card-line)] bg-[var(--card)] p-4">
      <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--color-muted)]">
        Your XI
      </p>
      <div className="space-y-3">
        {POS_ORDER.map(({ pos, label }) => {
          const group = xi.filter((p) => p.pos === pos);
          if (group.length === 0) return null;
          return (
            <div key={pos} className="flex items-start gap-3">
              <span
                className="w-16 shrink-0 pt-1 text-[10px] font-bold uppercase tracking-wider"
                style={{ color: posColor(pos) }}
              >
                {label}
              </span>
              <div className="flex flex-1 flex-wrap gap-1.5">
                {group
                  .sort((a, b) => b.rating - a.rating)
                  .map((p) => (
                    <span
                      key={p.id}
                      className="flex items-center gap-1.5 rounded-full border border-[var(--card-line)] py-0.5 pl-2.5 pr-1"
                    >
                      <span className="text-xs font-semibold">{p.name}</span>
                      <RatingBadge rating={p.rating} size="sm" />
                    </span>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ResultView({
  result,
  xi,
  seasonLabel,
  winnerPts,
  anonymous = false,
  onReplay,
  onShare,
  shared,
}: {
  result: SeasonResult;
  xi: Player[];
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
  const beatRecord = result.points >= RECORD_POINTS;
  const beatChampion = result.points > winnerPts;
  const scorers = topScorers(result, 3);

  // Progress bar scaled to the target, with a tick at the 100-point record.
  const pct = Math.min(100, (result.points / TARGET_POINTS) * 100);
  const recordPct = (RECORD_POINTS / TARGET_POINTS) * 100;
  const total = result.won + result.drawn + result.lost || 1;

  const headline = hit
    ? '🏆 Record broken — you reached 101!'
    : beatRecord
      ? `Matched the 100-point mark — ${TARGET_POINTS - result.points} short of the record.`
      : `${TARGET_POINTS - result.points} points short of the 101 record.`;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      {/* Hero */}
      <div
        className={`relative overflow-hidden rounded-2xl border bg-[var(--card)] px-6 py-7 text-center ${
          hit ? 'border-[var(--color-accent)]' : 'border-[var(--card-line)]'
        }`}
      >
        {hit && (
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{ background: 'radial-gradient(circle at 50% 0%, var(--color-accent), transparent 60%)' }}
          />
        )}
        <p className="relative text-[11px] font-bold uppercase tracking-[0.35em] text-[var(--color-muted)]">
          Final standing
        </p>
        <div className="relative mt-3 flex items-end justify-center gap-2">
          <span
            className="text-8xl font-black leading-[0.8] tabular-nums sm:text-9xl"
            style={{
              fontFamily: 'var(--font-numeral)',
              color: hit ? 'var(--color-accent)' : 'var(--fg)',
              textShadow: hit ? '0 0 32px color-mix(in srgb, var(--color-accent) 50%, transparent)' : undefined,
            }}
          >
            {result.points}
          </span>
          <span className="pb-3 text-2xl font-bold text-[var(--color-muted)]">pts</span>
        </div>
        <p
          className={`relative mt-2 text-sm font-bold ${
            hit ? 'text-[var(--color-accent)]' : 'text-[var(--color-accent-2)]'
          }`}
        >
          {headline}
        </p>

        {/* Progress vs the 100/101 record */}
        <div className="relative mt-5">
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--fg)_12%,transparent)]">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: hit ? 'var(--color-accent)' : 'var(--color-accent-3)',
              }}
            />
          </div>
          {/* record tick */}
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

        {/* Per-season champion badge (challenge mode only) */}
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

      {/* Win / draw / loss shape */}
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
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
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
        <p className="mt-2 text-center text-xs text-[var(--color-muted)]">
          XI strength — attack <span className="font-bold text-[var(--fg)]">{str.attack}</span> · defense{' '}
          <span className="font-bold text-[var(--fg)]">{str.defense}</span>
        </p>
      </div>

      {/* The XI that did it */}
      <TeamSheet xi={xi} />

      {/* Golden boot */}
      {scorers.length > 0 && (
        <div className="rounded-[var(--radius)] border border-[var(--card-line)] bg-[var(--card)] p-4">
          <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--color-muted)]">
            ⚽ Golden Boot
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {scorers.map((s, i) => (
              <span key={s.name} className="flex items-center gap-2 text-sm">
                <span className={i === 0 ? 'font-bold text-[var(--color-accent)]' : 'font-medium'}>
                  {i === 0 && '👑 '}
                  {s.name}
                </span>
                <span
                  className="rounded-md bg-[color-mix(in_srgb,var(--fg)_8%,transparent)] px-1.5 text-xs font-black tabular-nums"
                  style={{ fontFamily: 'var(--font-numeral)' }}
                >
                  {s.goals}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Match list (challenge mode only) */}
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

      {/* Actions */}
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
