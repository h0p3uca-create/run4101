import { ImageResponse } from 'next/og';

export const alt = 'Runfor101 — reach 101 points';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-static';

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
          background: 'linear-gradient(135deg, #4b0a52 0%, #37003c 60%, #1a0a1c 100%)',
          color: '#f6f4f8',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 30, letterSpacing: 12, color: '#8b8294', textTransform: 'uppercase' }}>
          Premier League — inspired
        </div>
        <div style={{ display: 'flex', fontSize: 180, fontWeight: 900, marginTop: 10 }}>
          <span>Runfor</span>
          <span style={{ color: '#00ff85' }}>101</span>
        </div>
        <div style={{ fontSize: 40, color: '#c9b8d6', marginTop: 10 }}>
          Roll a club · build an XI · reach 101 points
        </div>
        <div
          style={{
            marginTop: 44,
            display: 'flex',
            gap: 28,
            fontSize: 28,
            letterSpacing: 4,
            color: '#8b8294',
            textTransform: 'uppercase',
          }}
        >
          <span>Roll</span>
          <span style={{ color: '#4b0a52' }}>•</span>
          <span>Pick</span>
          <span style={{ color: '#4b0a52' }}>•</span>
          <span>Simulate</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
