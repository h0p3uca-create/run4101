import { forwardRef } from 'react';
import type { Formation, Player, SeasonResult } from '@/lib/types';
import Pitch from './Pitch';

/**
 * Off-screen 1080×1350 scorecard captured to PNG for "Share score".
 * Self-contained dark-purple brand styling (wrapped in `dark` so the pitch's
 * theme vars resolve to the neon palette regardless of the page theme).
 */
const ShareCard = forwardRef<
  HTMLDivElement,
  {
    result: SeasonResult;
    xi: Player[];
    formation?: Formation;
    placed?: Record<string, Player>;
    verdictLabel: string;
    verdictColor: string;
    topScorer?: { name: string; goals: number };
  }
>(function ShareCard({ result, xi, formation, placed, verdictLabel, verdictColor, topScorer }, ref) {
  const gd = `${result.goalDifference >= 0 ? '+' : ''}${result.goalDifference}`;
  const stat = (label: string, value: string, color?: string) => (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: '18px 8px',
        borderRadius: 16,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <span style={{ fontFamily: 'var(--font-numeral)', fontSize: 44, fontWeight: 900, color: color ?? '#f6f4f8' }}>
        {value}
      </span>
      <span style={{ fontSize: 18, letterSpacing: 2, color: '#a99bb3', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );

  return (
    <div
      ref={ref}
      className="dark"
      style={{
        width: 1080,
        height: 1350,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '56px 60px',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(155deg, #511059 0%, #37003c 52%, #170818 100%)',
        color: '#f6f4f8',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* pitch stripes + glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          background: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.03) 0 70px, rgba(0,0,0,0.05) 70px 140px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: -260,
          display: 'flex',
          width: 1000,
          height: 520,
          opacity: 0.16,
          background: `radial-gradient(closest-side, ${verdictColor}, transparent)`,
        }}
      />

      {/* header */}
      <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: 1 }}>
          <span>RUNFOR</span>
          <span style={{ color: '#00ff85' }}>101</span>
        </div>
        <div style={{ display: 'flex', fontSize: 24, letterSpacing: 3, color: '#a99bb3' }}>runfor101.xyz</div>
      </div>

      {/* verdict + points */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 30 }}>
        <div
          style={{
            display: 'flex',
            fontFamily: 'var(--font-display)',
            fontSize: 56,
            textTransform: 'uppercase',
            color: verdictColor,
          }}
        >
          {verdictLabel}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: 2 }}>
          <span
            style={{
              fontFamily: 'var(--font-numeral)',
              fontSize: 210,
              fontWeight: 900,
              lineHeight: 1,
              color: result.reachedTarget ? '#00ff85' : '#f6f4f8',
            }}
          >
            {result.points}
          </span>
          <span style={{ display: 'flex', fontSize: 48, fontWeight: 800, color: '#a99bb3', paddingBottom: 26 }}>
            / 101 pts
          </span>
        </div>
      </div>

      {/* the XI on the pitch */}
      {formation && placed && (
        <div style={{ display: 'flex', width: 560, marginTop: 26 }}>
          <Pitch formation={formation} placed={placed} />
        </div>
      )}

      {/* stats */}
      <div style={{ display: 'flex', width: '100%', gap: 12, marginTop: 28 }}>
        {stat('Won', String(result.won), '#00ff85')}
        {stat('Drawn', String(result.drawn))}
        {stat('Lost', String(result.lost), '#ff5a8a')}
        {stat('GF', String(result.goalsFor))}
        {stat('GA', String(result.goalsAgainst))}
        {stat('GD', gd)}
      </div>

      {/* golden boot + footer */}
      <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        {topScorer ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22, letterSpacing: 2, color: '#a99bb3', textTransform: 'uppercase' }}>
              Golden Boot
            </span>
            <span style={{ display: 'flex', fontSize: 26, fontWeight: 800, color: '#00ff85' }}>
              {topScorer.name} · {topScorer.goals}
            </span>
          </div>
        ) : (
          <span />
        )}
        <span style={{ display: 'flex', fontSize: 24, color: '#ddd2e4' }}>Beat the 101-point record</span>
      </div>
    </div>
  );
});

export default ShareCard;
