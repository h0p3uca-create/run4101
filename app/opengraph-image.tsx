import { ImageResponse } from 'next/og';

export const alt = 'Runfor101 — roll a club, build your dream XI, beat the 101-point record';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-static';

// FUT-style rating cards — the game's signature visual — to evoke a dream XI.
const CARDS: { r: number; pos: string; tone: 'gold' | 'green' | 'cyan' }[] = [
  { r: 95, pos: 'ST', tone: 'gold' },
  { r: 93, pos: 'RW', tone: 'gold' },
  { r: 91, pos: 'CM', tone: 'green' },
  { r: 88, pos: 'CB', tone: 'green' },
  { r: 86, pos: 'GK', tone: 'cyan' },
];

const TONE = {
  gold: { bg: 'linear-gradient(160deg, #ffe492 0%, #f5a623 100%)', ink: '#2a1400', ring: '#ffd35c' },
  green: { bg: 'linear-gradient(160deg, #43ffa0 0%, #00d268 100%)', ink: '#052015', ring: '#00ff85' },
  cyan: { bg: 'linear-gradient(160deg, #7df6ff 0%, #04c9d6 100%)', ink: '#04212a', ring: '#04f5ff' },
};

// Static branded social card generated at build time (works with output: export).
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          background: 'linear-gradient(150deg, #4b0a52 0%, #37003c 55%, #1a0a1c 100%)',
          color: '#f6f4f8',
          fontFamily: 'sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* pitch stripes */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            background:
              'repeating-linear-gradient(180deg, rgba(255,255,255,0.03) 0 56px, rgba(0,0,0,0.05) 56px 112px)',
          }}
        />
        {/* top accent glow */}
        <div
          style={{
            position: 'absolute',
            top: -260,
            display: 'flex',
            width: 900,
            height: 520,
            background: 'radial-gradient(closest-side, rgba(0,255,133,0.28), rgba(0,255,133,0))',
          }}
        />

        <div style={{ display: 'flex', fontSize: 28, letterSpacing: 14, color: '#a99bb3', textTransform: 'uppercase' }}>
          Premier League — inspired
        </div>

        <div style={{ display: 'flex', fontSize: 184, fontWeight: 900, marginTop: 6, letterSpacing: -4 }}>
          <span style={{ textShadow: '6px 6px 0 #e90052' }}>Runfor</span>
          <span style={{ color: '#00ff85', textShadow: '6px 6px 0 #006b38' }}>101</span>
        </div>

        <div style={{ display: 'flex', fontSize: 38, color: '#d8cce0', marginTop: 8 }}>
          Roll a club · build your dream XI · reach 101 points
        </div>

        {/* dream-XI rating cards */}
        <div style={{ display: 'flex', gap: 22, marginTop: 44 }}>
          {CARDS.map((c) => {
            const t = TONE[c.tone];
            return (
              <div
                key={c.pos}
                style={{
                  width: 104,
                  height: 138,
                  borderRadius: 18,
                  background: t.bg,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 14px 30px rgba(0,0,0,0.45), 0 0 0 3px ${t.ring}`,
                }}
              >
                <div style={{ display: 'flex', fontSize: 64, fontWeight: 900, color: t.ink, lineHeight: 1 }}>{String(c.r)}</div>
                <div style={{ display: 'flex', fontSize: 26, fontWeight: 800, color: t.ink, letterSpacing: 3, marginTop: 4 }}>{c.pos}</div>
              </div>
            );
          })}
        </div>
      </div>
    ),
    { ...size },
  );
}
