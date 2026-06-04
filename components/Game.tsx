'use client';
import { useState } from 'react';
import type { Opponent, Player, SeasonResult } from '@/lib/types';
import {
  createRoll,
  roll as rollDraw,
  reroll as rerollDraw,
  pick as pickPlayer,
  lineup,
  type RollState,
} from '@/lib/engine/rollbuild';
import { simulateSeason } from '@/lib/engine/simulate';
import { dailySeed } from '@/lib/engine/rng';
import { TARGET_POINTS } from '@/lib/engine/config';
import {
  getSeason,
  seasonOpponents,
  DEFAULT_SEASON_ID,
} from '@/lib/data/seasons';
import SetupScreen, { type StartMode } from './SetupScreen';
import RollBuild from './RollBuild';
import ResultView from './ResultView';
import ThemeToggle from './ThemeToggle';

type Phase = 'setup' | 'build' | 'result';

function randomSeed(): string {
  const c = globalThis.crypto;
  if (c && 'randomUUID' in c) return `r-${c.randomUUID().slice(0, 8)}`;
  return `r-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

export default function Game() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [seasonId, setSeasonId] = useState(DEFAULT_SEASON_ID);
  const [formationId, setFormationId] = useState('4-3-3');
  const [seed, setSeed] = useState('');
  const [mode, setMode] = useState<StartMode>('random');
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [build, setBuild] = useState<RollState | null>(null);
  const [result, setResult] = useState<SeasonResult | null>(null);
  const [finalXi, setFinalXi] = useState<Player[]>([]);
  const [shared, setShared] = useState(false);

  function start(sId: string, fId: string, m: StartMode) {
    const season = getSeason(sId);
    const s = `${sId}|${m === 'daily' ? dailySeed() : randomSeed()}`;
    setSeasonId(sId);
    setFormationId(fId);
    setMode(m);
    setSeed(s);
    setOpponents(seasonOpponents(season));
    setBuild(rollDraw(createRoll({ seed: s, season, formationId: fId })));
    setResult(null);
    setShared(false);
    setPhase('build');
  }

  const onRoll = () => build && setBuild(rollDraw(build));
  const onReroll = () => build && setBuild(rerollDraw(build));
  const onPick = (id: string) => build && setBuild(pickPlayer(build, id));

  function onSimulate() {
    if (!build) return;
    const xi = lineup(build);
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
      `gofor101.com`;
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
      {phase === 'build' && build && (
        <RollBuild
          state={build}
          formationId={formationId}
          onRoll={onRoll}
          onReroll={onReroll}
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
