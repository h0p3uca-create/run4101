// Curated rating overrides — hand-tuned peak ratings for players the source
// FIFA/synth data gets wrong. The source hard-caps everyone at 91, flattening
// the top tier (a super-sub tied with Henry), and under-rates several defenders
// and a few breakout players. Each entry is the player's intended PEAK rating;
// apply-overrides.ts shifts their whole career curve by (target − currentPeak),
// so the shape is preserved and re-running is idempotent.

/** Match both "Cristiano Ronaldo" and "C. Ronaldo" → "c|ronaldo". */
export function mergeKey(name: string): string {
  const parts = name.replace(/\./g, '').trim().split(/\s+/);
  const initial = (parts[0][0] ?? '').toLowerCase();
  const surname = parts
    .slice(1)
    .join('')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '');
  return `${initial}|${surname}`;
}

// [canonical display name, target peak rating]
const ENTRIES: [string, number][] = [
  // ── Break the 91 cap: real elites up ──────────────────────────────
  ['Thierry Henry', 95], ['Cristiano Ronaldo', 95], ['Luis Suárez', 94],
  ['Sergio Agüero', 94], ['Kevin De Bruyne', 94], ['Mohamed Salah', 93],
  ['Erling Haaland', 93], ['Eden Hazard', 93], ['Steven Gerrard', 92],
  ['Wayne Rooney', 92], ['Robin van Persie', 92], ['Harry Kane', 92],
  ['Virgil van Dijk', 92], ['Gareth Bale', 92], ['Didier Drogba', 92],
  ['Gianfranco Zola', 92], ['Petr Čech', 92],
  // ── Flattered-to-91/90: down to real level ────────────────────────
  ['Ole Gunnar Solskjær', 85], ['Nani', 84], ['Dirk Kuyt', 83],
  ['Emmanuel Adebayor', 85], ['Eidur Gudjohnsen', 85], ['Jerzy Dudek', 85],
  ['Nicolas Anelka', 87], ['Pepe Reina', 87], ['Edin Džeko', 86],
  ['Dimitar Berbatov', 87], ['Joe Hart', 86], ['Laurent Robert', 82],
  ['Peter Crouch', 82], ['Andrey Arshavin', 85], ['Álvaro Negredo', 84],
  ['Theo Walcott', 84], ['José Antonio Reyes', 84], ['Fabien Barthez', 85],
  ['Teddy Sheringham', 87], ['Chicharito', 85],
  // ── Under-rated defenders & midfielders: up ───────────────────────
  ['Rio Ferdinand', 89], ['John Terry', 89], ['Roy Keane', 90],
  ['Nemanja Vidić', 88], ['Ashley Cole', 88], ['Ricardo Carvalho', 85],
  ['Patrick Vieira', 90], ['Paul Scholes', 90], ['Mesut Özil', 87],
  ['Declan Rice', 84], ['Bukayo Saka', 86], ['James Maddison', 85],
  ['Michael Carrick', 87],
  // ── Anomalies / wrong snapshots: fix (Son is already 89 in data — left as is)
  ['Bruno Fernandes', 88], ['Kasper Schmeichel', 84],
  ['Riyad Mahrez', 89], ['Jamie Vardy', 89], ['Diego Costa', 89],
];

/** mergeKey → { target, canonical display name } */
export const OVERRIDES = new Map(
  ENTRIES.map(([name, target]) => [mergeKey(name), { target, canonical: name }]),
);
