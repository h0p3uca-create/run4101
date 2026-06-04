'use client';
import { useState } from 'react';
import type { Player, SeasonResult } from '@/lib/types';
import {
  createDraft,
  pick,
  aiPick,
  isComplete,
  isUserTurn,
  currentManagerIndex,
  getUserXi,
  type DraftState,
} from '@/lib/engine/draft';
import { simulateSeason } from '@/lib/engine/simulate';
import { dailySeed } from '@/lib/engine/rng';
import { TARGET_POINTS } from '@/lib/engine/config';
import {
  getSeason,
  seasonPool,
  seasonOpponents,
  DEFAULT_SEASON_ID,
} from '@/lib/data/seasons';
import type { Opponent } from '@/lib/types';
import SetupScreen, { type StartMode } from './SetupScreen';
import DraftBoard, { type RivalPick } from './DraftBoard';
import ResultView from './ResultView';
import ThemeToggle from './ThemeToggle';

type Phase = 'setup' | 'draft' | 'result';

function randomSeed(): string {
  const c = globalThis.crypto;
  if (c && 'randomUUID' in c) return `r-${c.randomUUID().slice(0, 8)}`;
  return `r-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

/** Advance AI managers until it's the user's turn; collect what rivals signed. */
function advanceAi(state: DraftState): { state: DraftState; picks: RivalPick[] } {
  let s = state;
  const picks: RivalPick[] = [];
  while (!isComplete(s) && !isUserTurn(s)) {
    const mgrIdx = currentManagerIndex(s);
    const beforeIds = new Set(s.pool.map((p) => p.id));
    const name = s.managers[mgrIdx].name;
    s = aiPick(s);
    const taken = [...beforeIds].find((id) => !s.pool.some((p) => p.id === id));
    const player = state.pool.find((p) => p.id === taken);
    if (player) picks.push({ manager: name, player });
  }
  return { state: s, picks };
}

export default function Game() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [seasonId, setSeasonId] = useState(DEFAULT_SEASON_ID);
  const [formationId, setFormationId] = useState('4-3-3');
  const [seed, setSeed] = useState('');
  const [mode, setMode] = useState<StartMode>('random');
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [rivalPicks, setRivalPicks] = useState<RivalPick[]>([]);
  const [result, setResult] = useState<SeasonResult | null>(null);
  const [finalXi, setFinalXi] = useState<Player[]>([]);
  const [shared, setShared] = useState(false);

  function start(sId: string, fId: string, m: StartMode) {
    const season = getSeason(sId);
    const s = m === 'daily' ? `${sId}|${dailySeed()}` : `${sId}|${randomSeed()}`;
    setSeasonId(sId);
    setFormationId(fId);
    setMode(m);
    setSeed(s);
    setOpponents(seasonOpponents(season));
    const initial = createDraft({
      seed: s,
      userFormationId: fId,
      pool: seasonPool(season),
    });
    const { state, picks } = advanceAi(initial);
    setDraft(state);
    setRivalPicks(picks);
    setResult(null);
    setShared(false);
    setPhase('draft');
  }

  function onPick(id: string) {
    if (!draft) return;
    const afterUser = pick(draft, id);
    const { state, picks } = advanceAi(afterUser);
    setDraft(state);
    setRivalPicks(picks);
  }

  function onSimulate() {
    if (!draft) return;
    const xi = getUserXi(draft);
    setFinalXi(xi);
    setResult(simulateSeason(xi, { seed, opponents }));
    setPhase('result');
  }

  function onShare() {
    if (!result) return;
    const tag = `${seasonId}${mode === 'daily' ? ' · daily' : ''}`;
    const text =
      `Gofor101 ${tag} — ${result.points}/${TARGET_POINTS} pts ${result.reachedTarget ? '🏆' : ''}\n` +
      `W${result.won} D${result.drawn} L${result.lost} · GD ${result.goalDifference >= 0 ? '+' : ''}${result.goalDifference}\n` +
      `${tag}\ngofor101.com`;
    navigator.clipboard?.writeText(text).then(
      () => {
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      },
      () => {},
    );
  }

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setPhase('setup')}
          className="text-sm font-black tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Gofor<span className="text-[var(--color-accent)]">101</span>
        </button>
        <ThemeToggle />
      </header>

      {phase === 'setup' && <SetupScreen onStart={start} />}
      {phase === 'draft' && draft && (
        <DraftBoard
          state={draft}
          formationId={formationId}
          rivalPicks={rivalPicks}
          onPick={onPick}
          onSimulate={onSimulate}
        />
      )}
      {phase === 'result' && result && (
        <ResultView
          result={result}
          xi={finalXi}
          seasonLabel={getSeason(seasonId).label}
          winnerPts={getSeason(seasonId).winnerPts}
          onReplay={() => setPhase('setup')}
          onShare={onShare}
          shared={shared}
        />
      )}
    </main>
  );
}
