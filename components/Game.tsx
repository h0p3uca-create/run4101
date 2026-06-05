'use client';
import { useEffect, useReducer, useRef } from 'react';
import type { Opponent, Player, SeasonResult } from '@/lib/types';
import {
  createRoll,
  roll as rollDraw,
  reroll as rerollDraw,
  pick as pickPlayer,
  pickInto as pickPlayerInto,
  moveTo,
  removeFrom,
  lineup,
  type RollState,
  type BuildMode,
} from '@/lib/engine/rollbuild';
import { simulateSeason } from '@/lib/engine/simulate';
import { dailySeed } from '@/lib/engine/rng';
import { loadSeason, seasonOpponents, SEASONS_INDEX } from '@/lib/data/seasons';
import { seasonSources, allTimeSources } from '@/lib/data/pool';
import { OPPONENTS, withDifficulty, type Difficulty } from '@/lib/data/opponents';
import { getFormation } from '@/lib/data/formations';
import { recordResult } from '@/lib/stats';
import SetupScreen, { type StartOptions } from './SetupScreen';
import RollBuild from './RollBuild';
import ResultView from './ResultView';
import ThemeToggle from './ThemeToggle';
import Footer from './Footer';

type Phase = 'setup' | 'build' | 'result';

/** Everything needed to seed/label a session, resolved once squads load. */
interface Session {
  mode: BuildMode;
  seasonId: string | null;
  seasonLabel: string;
  winnerPts: number;
  formationId: string;
  difficulty: Difficulty;
  seed: string;
  opponents: Opponent[];
}

interface GameState extends Session {
  phase: Phase;
  loading: boolean;
  loadError: string | null;
  build: RollState | null;
  result: SeasonResult | null;
  finalXi: Player[];
}

const INITIAL: GameState = {
  phase: 'setup',
  loading: false,
  loadError: null,
  mode: 'main',
  seasonId: null,
  seasonLabel: 'All-time',
  winnerPts: 0,
  formationId: '4-3-3',
  difficulty: 'normal',
  seed: '',
  opponents: [],
  build: null,
  result: null,
  finalXi: [],
};

type Action =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_ERROR'; message: string }
  | { type: 'SESSION_READY'; session: Session; build: RollState }
  | { type: 'ROLL' }
  | { type: 'REROLL' }
  | { type: 'PICK'; id: string }
  | { type: 'PICK_INTO'; id: string; slotId: string }
  | { type: 'MOVE'; from: string; to: string }
  | { type: 'REMOVE'; slotId: string }
  | { type: 'SIMULATE' }
  | { type: 'GOTO_SETUP' };

// Engine calls live INSIDE the reducer, derived from current state — no stale
// closures, every build transition is a pure function of the prior state.
function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true, loadError: null };
    case 'LOAD_ERROR':
      return { ...state, loading: false, loadError: action.message, phase: 'setup' };
    case 'SESSION_READY':
      return {
        ...state,
        ...action.session,
        build: action.build,
        result: null,
        loading: false,
        loadError: null,
        phase: 'build',
      };
    case 'ROLL':
      return state.build ? { ...state, build: rollDraw(state.build) } : state;
    case 'REROLL':
      return state.build ? { ...state, build: rerollDraw(state.build) } : state;
    case 'PICK':
      return state.build ? { ...state, build: pickPlayer(state.build, action.id) } : state;
    case 'PICK_INTO':
      return state.build
        ? { ...state, build: pickPlayerInto(state.build, action.id, action.slotId) }
        : state;
    case 'MOVE':
      return state.build
        ? { ...state, build: moveTo(state.build, action.from, action.to) }
        : state;
    case 'REMOVE':
      return state.build ? { ...state, build: removeFrom(state.build, action.slotId) } : state;
    case 'SIMULATE': {
      if (!state.build) return state;
      const xi = lineup(state.build);
      return {
        ...state,
        finalXi: xi,
        result: simulateSeason(xi, { seed: state.seed, opponents: state.opponents }),
        phase: 'result',
      };
    }
    case 'GOTO_SETUP':
      return { ...state, phase: 'setup' };
    default:
      return state;
  }
}

function randomSeed(): string {
  const c = globalThis.crypto;
  if (c && 'randomUUID' in c) return c.randomUUID().slice(0, 8);
  return Math.floor(Math.random() * 1e9).toString(36);
}

export default function Game() {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const {
    phase, loading, loadError, mode, seasonId, seasonLabel,
    winnerPts, formationId, difficulty, seed, build, result, finalXi,
  } = state;

  async function startSeed(
    m: BuildMode,
    sId: string | null,
    fId: string,
    diff: Difficulty,
    seedStr: string,
  ) {
    dispatch({ type: 'LOAD_START' });
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
      opp = withDifficulty(opp, diff);
      const built = rollDraw(
        createRoll({ seed: seedStr, mode: m, formation: getFormation(fId), sources }),
      );
      dispatch({
        type: 'SESSION_READY',
        session: {
          mode: m,
          seasonId: sId,
          seasonLabel: label,
          winnerPts: pts,
          formationId: fId,
          difficulty: diff,
          seed: seedStr,
          opponents: opp,
        },
        build: built,
      });
    } catch (err) {
      console.error('Failed to start session:', err);
      dispatch({
        type: 'LOAD_ERROR',
        message: "Couldn't load the squad data. Check your connection and try again.",
      });
    }
  }

  function start(o: StartOptions) {
    const rand = o.daily ? dailySeed() : randomSeed();
    void startSeed(o.mode, o.seasonId, o.formationId, o.difficulty, `${o.mode}:${o.seasonId ?? 'all'}:${rand}`);
  }

  // Each screen replaces the page — start at the top (the result hero / the
  // roll panel should never open mid-scroll, esp. on mobile).
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [phase]);

  // Persist best score + attempt count once per finished season (keyed on the
  // result object identity, which is fresh per SIMULATE).
  const recordedResult = useRef<SeasonResult | null>(null);
  useEffect(() => {
    if (phase === 'result' && result && recordedResult.current !== result) {
      recordedResult.current = result;
      recordResult(result.points, result.reachedTarget);
    }
  }, [phase, result]);

  // Deep-link: ?s=<mode:season:rand>&f=<formation>&d=<difficulty> reproduces the draw.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('s');
    if (!s) return;
    const [m, sId] = s.split(':');
    if (m !== 'main' && m !== 'challenge') return;
    if (m === 'challenge' && !SEASONS_INDEX.some((x) => x.id === sId)) return;
    const d = params.get('d');
    const diff: Difficulty = d === 'hard' || d === 'brutal' ? d : 'normal';
    void startSeed(m, m === 'challenge' ? sId : null, params.get('f') || '4-3-3', diff, s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRoll = () => dispatch({ type: 'ROLL' });
  const onReroll = () => dispatch({ type: 'REROLL' });
  const onPick = (id: string) => dispatch({ type: 'PICK', id });
  const onPickInto = (id: string, slotId: string) => dispatch({ type: 'PICK_INTO', id, slotId });
  const onMove = (from: string, to: string) => dispatch({ type: 'MOVE', from, to });
  const onRemove = (slotId: string) => dispatch({ type: 'REMOVE', slotId });
  const onRestart = () => startSeed(mode, seasonId, formationId, difficulty, seed);
  const onSimulate = () => dispatch({ type: 'SIMULATE' });

  // Deep-link that reproduces the same draw sequence (shared with the scorecard).
  const shareOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'https://runfor101.xyz';
  const shareUrl = `${shareOrigin}/?s=${encodeURIComponent(seed)}&f=${formationId}${
    difficulty === 'normal' ? '' : `&d=${difficulty}`
  }`;

  // Announce the pivotal game-state changes to screen readers.
  const liveMessage =
    phase === 'result' && result
      ? `Full time — ${result.points} points${result.reachedTarget ? ', record broken!' : ''}.`
      : phase === 'build' && build?.drawn
        ? `Drew ${build.drawn.label}, ${build.drawn.squad.length} players.`
        : '';

  return (
    <main className="min-h-screen">
      {/* SR-only running commentary for the roll → result flow */}
      <div className="sr-only" aria-live="polite">
        {liveMessage}
      </div>
      <header
        className={`flex items-center justify-between px-4 py-3 ${
          phase !== 'setup' ? 'border-b-2 border-[var(--fg)]' : ''
        }`}
      >
        <button
          onClick={() => dispatch({ type: 'GOTO_SETUP' })}
          aria-label="Runfor101 — back to start"
          className="text-xl font-black tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          RUNFOR<span className="text-[var(--color-accent)]">101</span>
        </button>
        <div className="flex items-center gap-4">
          {phase === 'build' && (
            <span className="hidden text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] sm:inline">
              {formationId} · {mode === 'main' ? 'All-time' : seasonId}
            </span>
          )}
          <ThemeToggle />
        </div>
      </header>

      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg)]/80 backdrop-blur-sm"
        >
          <p className="animate-pulse text-sm uppercase tracking-widest text-[var(--color-muted)]">
            Dealing the squads…
          </p>
        </div>
      )}

      {phase === 'setup' && loadError && (
        <div
          role="alert"
          className="mx-auto mt-4 max-w-6xl px-6"
        >
          <div className="rounded-[var(--radius)] border border-[var(--color-accent-2)] bg-[color-mix(in_srgb,var(--color-accent-2)_10%,transparent)] px-4 py-3 text-sm font-semibold text-[var(--color-accent-2-ink)]">
            {loadError}
          </div>
        </div>
      )}
      {phase === 'setup' && <SetupScreen onStart={start} />}
      {phase === 'build' && build && (
        <RollBuild
          state={build}
          onRoll={onRoll}
          onReroll={onReroll}
          onPick={onPick}
          onPickInto={onPickInto}
          onMove={onMove}
          onRemove={onRemove}
          onRestart={onRestart}
          onSimulate={onSimulate}
        />
      )}
      {phase === 'result' && result && (
        <ResultView
          result={result}
          xi={finalXi}
          formation={build?.formation}
          placed={build?.placed}
          anonymous={mode === 'main'}
          seasonLabel={seasonLabel}
          winnerPts={winnerPts}
          onReplay={() => dispatch({ type: 'GOTO_SETUP' })}
          shareUrl={shareUrl}
        />
      )}

      <Footer />
    </main>
  );
}
