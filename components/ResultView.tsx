'use client';
import { useState } from 'react';
import type { Player, SeasonResult } from '@/lib/types';
import { TARGET_POINTS } from '@/lib/engine/config';
import { teamStrength } from '@/lib/engine/ratings';
import { topScorers } from '@/lib/engine/simulate';

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
    <div className="flex flex-col items-center rounded-[var(--radius)] border border-[var(--card-line)] px-2 py-3">
      <span
        className="text-2xl font-black tabular-nums"
        style={{ fontFamily: 'var(--font-numeral)', color: accent }}
      >
        {value}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </span>
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
  const pct = Math.min(100, (result.points / TARGET_POINTS) * 100);
  const str = teamStrength(xi);
  const hit = result.reachedTarget;
  const beatChampion = result.points > winnerPts;
  const scorers = topScorers(result, 3);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
          Final standing
        </p>
        <div className="mt-2 flex items-end justify-center gap-2">
          <span
            className="text-7xl font-black tabular-nums leading-none"
            style={{
              fontFamily: 'var(--font-numeral)',
              color: hit ? 'var(--color-accent)' : 'var(--fg)',
            }}
          >
            {result.points}
          </span>
          <span className="pb-2 text-2xl text-[var(--color-muted)]">/ {TARGET_POINTS}</span>
        </div>
        <p className={`mt-1 text-sm font-bold ${hit ? 'text-[var(--color-accent)]' : 'text-[var(--color-accent-2)]'}`}>
          {hit ? '🏆 Record broken! You reached 101.' : `${TARGET_POINTS - result.points} points short of the record.`}
        </p>

        {/* Per-season badge: did you beat that season's real champion? */}
        {!anonymous && (
        <div
          className={`mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold ${
            beatChampion
              ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
              : 'border-[var(--card-line)] text-[var(--color-muted)]'
          }`}
        >
          {beatChampion ? '🏅' : '○'} {seasonLabel.split('·')[0].trim()} champion: {winnerPts} pts
          <span className="opacity-70">
            {beatChampion ? `— beaten by ${result.points - winnerPts}!` : `— need ${winnerPts + 1 - result.points} more`}
          </span>
        </div>
        )}
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--fg)_12%,transparent)]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: hit ? 'var(--color-accent)' : 'var(--color-accent-3)' }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
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

      <p className="text-center text-xs text-[var(--color-muted)]">
        Your XI strength — attack {str.attack} · defense {str.defense}
      </p>

      {scorers.length > 0 && (
        <div className="rounded-[var(--radius)] border border-[var(--card-line)] p-3">
          <p className="mb-2 text-center text-[10px] uppercase tracking-widest text-[var(--color-muted)]">
            ⚽ Golden Boot
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            {scorers.map((s, i) => (
              <span key={s.name} className="text-sm">
                <span className={i === 0 ? 'font-bold text-[var(--color-accent)]' : 'font-medium'}>
                  {s.name}
                </span>{' '}
                <span
                  className="tabular-nums text-[var(--color-muted)]"
                  style={{ fontFamily: 'var(--font-numeral)' }}
                >
                  {s.goals}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {!anonymous && (
      <button
        onClick={() => setShowMatches((s) => !s)}
        aria-expanded={showMatches}
        className="self-center text-sm text-[var(--color-accent-3)] hover:underline"
      >
        {showMatches ? 'Hide' : 'Show'} all 38 results
      </button>
      )}

      {!anonymous && showMatches && (
        <div className="grid max-h-72 grid-cols-1 gap-1 overflow-y-auto rounded-[var(--radius)] border border-[var(--card-line)] p-2 sm:grid-cols-2">
          {result.matches.map((m, i) => (
            <div key={i} className="rounded px-2 py-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className={`pip-${m.outcome.toLowerCase()} font-bold w-3`}>
                    {m.outcome}
                  </span>
                  <span className="text-[10px] text-[var(--color-muted)]">
                    {m.home ? 'H' : 'A'}
                  </span>
                  <span className="truncate">{m.opponentName}</span>
                </span>
                <span className="tabular-nums font-semibold" style={{ fontFamily: 'var(--font-numeral)' }}>
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
