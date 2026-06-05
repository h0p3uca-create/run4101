import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const alt = 'Runfor101 — roll a club, build your dream XI, beat the 101-point record';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-static';

// Brand fonts, read at build time (static export runs in Node).
const fontDir = join(process.cwd(), 'app', 'og-fonts');
const anton = readFileSync(join(fontDir, 'Anton-Regular.ttf'));
const archivo = readFileSync(join(fontDir, 'ArchivoBlack-Regular.ttf'));

// FUT-style rating cards — the game's signature visual.
const CARDS: { r: number; pos: string; tone: 'gold' | 'green' | 'cyan' }[] = [
  { r: 95, pos: 'ST', tone: 'gold' },
  { r: 93, pos: 'RW', tone: 'gold' },
  { r: 91, pos: 'CM', tone: 'green' },
  { r: 88, pos: 'CB', tone: 'green' },
  { r: 86, pos: 'GK', tone: 'cyan' },
];
const TONE = {
  gold: { bg: 'linear-gradient(160deg, #ffe79a 0%, #f5a623 100%)', ink: '#3a1d00', ring: '#ffd35c' },
  green: { bg: 'linear-gradient(160deg, #4dffab 0%, #00cf66 100%)', ink: '#04241a', ring: '#00ff85' },
  cyan: { bg: 'linear-gradient(160deg, #8af6ff 0%, #04c4d3 100%)', ink: '#04222b', ring: '#04f5ff' },
};

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
          background: 'linear-gradient(155deg, #511059 0%, #37003c 52%, #170818 100%)',
          color: '#f6f4f8',
          fontFamily: 'Archivo Black',
          overflow: 'hidden',
        }}
      >
        {/* mowed-pitch stripes */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            background:
              'repeating-linear-gradient(180deg, rgba(255,255,255,0.035) 0 60px, rgba(0,0,0,0.05) 60px 120px)',
          }}
        />
        {/* accent glow */}
        <div
          style={{
            position: 'absolute',
            top: -300,
            display: 'flex',
            width: 1000,
            height: 560,
            background: 'radial-gradient(closest-side, rgba(0,255,133,0.25), rgba(0,255,133,0))',
          }}
        />
        {/* bottom magenta wash */}
        <div
          style={{
            position: 'absolute',
            bottom: -260,
            display: 'flex',
            width: 1100,
            height: 480,
            background: 'radial-gradient(closest-side, rgba(233,0,82,0.18), rgba(233,0,82,0))',
          }}
        />

        <div style={{ display: 'flex', fontSize: 26, letterSpacing: 16, color: '#b6a8c0' }}>
          PREMIER LEAGUE · INSPIRED
        </div>

        <div
          style={{
            display: 'flex',
            fontFamily: 'Anton',
            fontSize: 230,
            lineHeight: 1,
            marginTop: 18,
            letterSpacing: 1,
          }}
        >
          <span style={{ textShadow: '7px 7px 0 #e90052' }}>RUNFOR</span>
          <span style={{ color: '#00ff85', textShadow: '7px 7px 0 #00713c' }}>101</span>
        </div>

        <div style={{ display: 'flex', fontSize: 30, letterSpacing: 2, color: '#ddd2e4', marginTop: 22 }}>
          ROLL A CLUB · BUILD YOUR DREAM XI · REACH 101
        </div>

        {/* dream-XI rating cards */}
        <div style={{ display: 'flex', gap: 22, marginTop: 48 }}>
          {CARDS.map((c) => {
            const t = TONE[c.tone];
            return (
              <div
                key={c.pos}
                style={{
                  width: 110,
                  height: 146,
                  borderRadius: 20,
                  background: t.bg,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 16px 34px rgba(0,0,0,0.5), 0 0 0 3px ${t.ring}, inset 0 2px 0 rgba(255,255,255,0.55)`,
                }}
              >
                <div style={{ display: 'flex', fontSize: 66, color: t.ink, lineHeight: 1 }}>{String(c.r)}</div>
                <div style={{ display: 'flex', fontSize: 24, letterSpacing: 4, color: t.ink, marginTop: 6 }}>
                  {c.pos}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Anton', data: anton, weight: 400, style: 'normal' },
        { name: 'Archivo Black', data: archivo, weight: 900, style: 'normal' },
      ],
    },
  );
}
