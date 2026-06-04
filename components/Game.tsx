'use client';
import { useEffect, useState } from 'react';
import type { Opponent, Player, SeasonResult } from '@/lib/types';
import {
  createRoll,
  roll as rollDraw,
  reroll as rerollDraw,
  pick as pickPlayer,
  moveTo,
  lineup,
  type RollState,
  type BuildMode,
} from '@/lib/engine/rollbuild';
import { simulateSeason } from '@/lib/engine/simulate';
import { dailySeed } from '@/lib/engine/rng';
import { TARGET_POINTS } from '@/lib/engine/config';
import { loadSeason, seasonOpponents, SEASONS_INDEX } from '@/lib/data/seasons';
import { seasonSources, allTimeSources } from '@/lib/data/pool';
import { OPPONENTS } from '@/lib/data/opponents';
import { getFormation } from '@/lib/data/formations';
import SetupScreen, { type StartOptions } from './SetupScreen';
import RollBuild from './RollBuild';
import ResultView from './ResultView';
import ThemeToggle from './ThemeToggle';
import Footer from './Footer';

type Phase = 'setup' | 'build' | 'result';

function randomSeed(): string {
  const c = globalThis.crypto;
  if (c && 'randomUUID' in c) return c.randomUUID().slice(0, 8);
  return Math.floor(Math.random() * 1e9).toString(36);
}

export default function Game() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<BuildMode>('main');
  const [seasonId, setSeasonId] = useState<string | null>(null);
  const [seasonLabel, setSeasonLabel] = useState('All-time');
  const [winnerPts, setWinnerPts] = useState(0);
  const [formationId, setFormationId] = useState('4-3-3');
  const [seed, setSeed] = useState('');
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [build, setBuild] = useState<RollState | null>(null);
  const [result, setResult] = useState<SeasonResult | null>(null);
  const [finalXi, setFinalXi] = useState<Player[]>([]);
  const [shared, setShared] = useState(false);

  async function startSeed(m: BuildMode, sId: string | null, fId: string, seedStr: string) {
    setLoading(true);
    try {
      let label = 'All-time';
      let pts = 0;
      let sources;
      let opp: Opponent[];
      if (m === 'challenge' && sId) {
        const season = await loadSeason(sId);
        sources = seasonSources(season);
        opp = seasonOpponents(season);
        label = season.label;
        pts = season.winnerPts;
      } else {
        sources = await allTimeSources();
        opp = OPPONENTS;
      }
      setMode(m);
      setSeasonId(sId);
      setSeasonLabel(label);
      setWinnerPts(pts);
      setFormationId(fId);
      setSeed(seedStr);
      setOpponents(opp);
      setBuild(rollDraw(createRoll({ seed: seedStr, mode: m, formation: getFormation(fId), sources })));
      setResult(null);
      setShared(false);
      setPhase('build');
    } finally {
      setLoading(false);
    }
  }

  function start(o: StartOptions) {
    const rand = o.daily ? dailySeed() : randomSeed();
    void startSeed(o.mode, o.seasonId, o.formationId, `${o.mode}:${o.seasonId ?? 'all'}:${rand}`);
  }

  // Deep-link: ?s=<mode:season:rand>&f=<formation> reproduces the draw sequence.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('s');
    if (!s) return;
    const [m, sId] = s.split(':');
    if (m !== 'main' && m !== 'challenge') return;
    if (m === 'challenge' && !SEASONS_INDEX.some((x) => x.id === sId)) return;
    void startSeed(m, m === 'challenge' ? sId : null, params.get('f') || '4-3-3', s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRoll = () => build && setBuild(rollDraw(build));
  const onReroll = () => build && setBuild(rerollDraw(build));
  const onPick = (id: string) => build && setBuild(pickPlayer(build, id));
  const onMove = (from: string, to: string) => build && setBuild(moveTo(build, from, to));

  function onSimulate() {
    if (!build) return;
    const xi = lineup(build);
    setFinalXi(xi);
    setResult(simulateSeason(xi, { seed, opponents }));
    setPhase('result');
  }

  function onShare() {
    if (!result) return;
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://gofor101.com';
    const url = `${origin}/?s=${encodeURIComponent(seed)}&f=${formationId}`;
    const tag = mode === 'challenge' && seasonId ? seasonId : 'all-time';
    const text =
      `Gofor101 ${tag} — ${result.points}/${TARGET_POINTS} pts ${result.reachedTarget ? '🏆' : ''}\n` +
      `W${result.won} D${result.drawn} L${result.lost} · GD ${result.goalDifference >= 0 ? '+' : ''}${result.goalDifference}\n` +
      `Same draws: ${url}`;
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

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg)]/80 backdrop-blur-sm">
          <p className="animate-pulse text-sm uppercase tracking-widest text-[var(--color-muted)]">
            Drawing squads…
          </p>
        </div>
      )}

      {phase === 'setup' && <SetupScreen onStart={start} />}
      {phase === 'build' && build && (
        <RollBuild
          state={build}
          onRoll={onRoll}
          onReroll={onReroll}
          onPick={onPick}
          onMove={onMove}
          onSimulate={onSimulate}
        />
      )}
      {phase === 'result' && result && (
        <ResultView
          result={result}
          xi={finalXi}
          anonymous={mode === 'main'}
          seasonLabel={seasonLabel}
          winnerPts={winnerPts}
          onReplay={() => setPhase('setup')}
          onShare={onShare}
          shared={shared}
        />
      )}

      <Footer />
    </main>
  );
}
