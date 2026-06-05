// Curated rating overrides — hand-tuned peak ratings for players the source
// FIFA/synth data gets wrong. The source hard-caps everyone at 91, flattening
// the top tier (a super-sub tied with Henry), and under-rates several defenders
// and a few breakout players. Each entry is the player's intended PEAK rating;
// apply-overrides.ts shifts their whole career curve by (target − currentPeak),
// so the shape is preserved and re-running is idempotent.

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');

/** Stable key from a (resolved) full name — diacritics/punctuation-insensitive. */
export function nameKey(name: string): string {
  return norm(name);
}

/**
 * Initial+surname bucket — used ONLY to resolve abbreviated "F. Surname" forms
 * to a unique full name (see apply-overrides). Distinct full first names that
 * share it (Roy vs Robbie Keane) are kept apart by nameKey, not merged.
 */
export function bucketKey(name: string): string {
  const parts = name.replace(/\./g, '').trim().split(/\s+/);
  if (parts.length === 1) return norm(parts[0]);
  const initial = (parts[0][0] ?? '').toLowerCase();
  return `${initial}|${norm(parts.slice(1).join(''))}`;
}

export const isAbbreviated = (name: string) => {
  const first = name.replace(/\./g, '').trim().split(/\s+/)[0] ?? '';
  return name.trim().split(/\s+/).length > 1 && first.length === 1;
};
export const firstName = (name: string) => name.trim().split(/\s+/)[0];
export const surname = (name: string) => name.replace(/\./g, '').trim().split(/\s+/).slice(1).join(' ');

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
  // ── Sub-80 quality players stuck in the FIFA "79 clamp" — up ───────
  // defenders
  ['Gary Neville', 84], ['Wesley Fofana', 83], ['Lewis Dunk', 83],
  ['Steve Finnan', 82], ['Graeme Le Saux', 82], ['Michael Dawson', 82],
  ['Fabricio Coloccini', 82], ['Conor Coady', 82], ['Takehiro Tomiyasu', 82],
  ['Fabian Schär', 82], ['Younès Kaboul', 81], ['Matty Cash', 81],
  ['Aaron Cresswell', 81],
  // midfielders
  ['Juan Sebastián Verón', 84], ['Eberechi Eze', 84], ['John McGinn', 83],
  ['Darren Anderton', 82], ['Conor Gallagher', 82], ['Tom Huddlestone', 81],
  ['Mathieu Flamini', 81], ['Adel Taarabt', 81], ['Ruben Loftus-Cheek', 81],
  ['Aaron Mooy', 81], ['Jefferson Lerma', 81], ['Sander Berge', 81],
  ['Steven Davis', 81],
  // forwards
  ['Aleksandar Mitrović', 83], ['Andy Carroll', 82], ['Bobby Zamora', 81],
  ['Troy Deeney', 81], ['Ashley Barnes', 80], ['Manolo Gabbiadini', 80],
];

/** nameKey → { target, canonical display name } */
export const OVERRIDES = new Map(
  ENTRIES.map(([name, target]) => [nameKey(name), { target, canonical: name }]),
);

// Curated POSITION alternatives — extra FIFA codes for versatile attackers the
// source data pins to one role (Henry only ST, Bale only RW…). Merged on top of
// the systematic adjacent-code expansion in apply-overrides. [name, extra codes].
const POS_ENTRIES: [string, string[]][] = [
  ['Thierry Henry', ['LW']], ['Robin van Persie', ['LW']], ['Luis Suárez', ['LW', 'CF']],
  ['Carlos Tevez', ['RW', 'CF']], ['Lukas Podolski', ['LW']], ['Alexander Isak', ['LW']],
  ['Nicolas Anelka', ['LW']], ['Louis Saha', ['LW']], ['Emmanuel Adebayor', ['RW']],
  ['Gareth Bale', ['LW', 'ST']], ['Bukayo Saka', ['LW']], ['Gabriel Martinelli', ['ST', 'RW']],
  ['Arjen Robben', ['LW']], ['Craig Bellamy', ['ST', 'RW']], ['Harry Kewell', ['ST']],
  ['Salomon Kalou', ['RW', 'ST']], ['Damien Duff', ['LW']], ['André Schürrle', ['RW']],
  ['Kevin Mirallas', ['LW', 'ST']], ['Yossi Benayoun', ['LW']], ['Luis García', ['LW']],
  ['Gianfranco Zola', ['CAM', 'ST']], ['Clint Dempsey', ['ST', 'LW']], ['Dimitar Berbatov', ['CAM']],
  ['Eidur Gudjohnsen', ['CAM']],
];

/** nameKey → extra position codes to add. */
export const POSITION_OVERRIDES = new Map(POS_ENTRIES.map(([name, codes]) => [nameKey(name), codes]));
