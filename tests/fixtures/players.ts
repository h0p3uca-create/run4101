import type { Player } from '@/lib/types';

// All-time Premier League-era (1992+) pool. Ratings are subjective/derived
// for gameplay balance — att (attacking output), def (defensive output),
// rating (headline, drives draft desirability). No photos/marks used.
//
// Distribution: GK 6 · DEF 14 · MID 14 · FWD 12  (= 46), enough to run a
// snake draft with real scarcity while filling any formation.

export const PLAYERS: Player[] = [
  // ── Goalkeepers ──────────────────────────────────────────────
  { id: 'gk-schmeichel', name: 'P. Schmeichel', pos: 'GK', att: 12, def: 92, rating: 91, era: '1992–1999' },
  { id: 'gk-cech', name: 'P. Čech', pos: 'GK', att: 10, def: 90, rating: 89, era: '2004–2019' },
  { id: 'gk-vandersar', name: 'E. van der Sar', pos: 'GK', att: 14, def: 88, rating: 88, era: '2005–2011' },
  { id: 'gk-degea', name: 'D. De Gea', pos: 'GK', att: 9, def: 87, rating: 86, era: '2011–2023' },
  { id: 'gk-seaman', name: 'D. Seaman', pos: 'GK', att: 8, def: 85, rating: 85, era: '1992–2003' },
  { id: 'gk-friedel', name: 'B. Friedel', pos: 'GK', att: 8, def: 82, rating: 82, era: '1997–2015' },

  // ── Defenders ────────────────────────────────────────────────
  { id: 'df-vandijk', name: 'V. van Dijk', pos: 'DEF', att: 52, def: 93, rating: 92, era: '2018–' },
  { id: 'df-ferdinand', name: 'R. Ferdinand', pos: 'DEF', att: 45, def: 90, rating: 90, era: '2002–2014' },
  { id: 'df-vidic', name: 'N. Vidić', pos: 'DEF', att: 42, def: 90, rating: 89, era: '2006–2014' },
  { id: 'df-terry', name: 'J. Terry', pos: 'DEF', att: 48, def: 89, rating: 89, era: '1998–2017' },
  { id: 'df-kompany', name: 'V. Kompany', pos: 'DEF', att: 50, def: 88, rating: 88, era: '2008–2019' },
  { id: 'df-carragher', name: 'J. Carragher', pos: 'DEF', att: 38, def: 86, rating: 85, era: '1996–2013' },
  { id: 'df-adams', name: 'T. Adams', pos: 'DEF', att: 44, def: 87, rating: 86, era: '1992–2002' },
  { id: 'df-stam', name: 'J. Stam', pos: 'DEF', att: 40, def: 87, rating: 86, era: '1998–2001' },
  { id: 'df-acole', name: 'A. Cole', pos: 'DEF', att: 66, def: 85, rating: 86, era: '1999–2014' },
  { id: 'df-taa', name: 'T. Alexander-Arnold', pos: 'DEF', att: 78, def: 78, rating: 85, era: '2016–' },
  { id: 'df-robertson', name: 'A. Robertson', pos: 'DEF', att: 74, def: 82, rating: 85, era: '2017–' },
  { id: 'df-gneville', name: 'G. Neville', pos: 'DEF', att: 58, def: 84, rating: 84, era: '1992–2011' },
  { id: 'df-campbell', name: 'S. Campbell', pos: 'DEF', att: 46, def: 86, rating: 85, era: '1992–2011' },
  { id: 'df-baines', name: 'L. Baines', pos: 'DEF', att: 68, def: 80, rating: 82, era: '2007–2020' },

  // ── Midfielders ──────────────────────────────────────────────
  { id: 'mf-debruyne', name: 'K. De Bruyne', pos: 'MID', att: 92, def: 60, rating: 92, era: '2015–' },
  { id: 'mf-gerrard', name: 'S. Gerrard', pos: 'MID', att: 86, def: 78, rating: 90, era: '1998–2015' },
  { id: 'mf-lampard', name: 'F. Lampard', pos: 'MID', att: 88, def: 68, rating: 90, era: '1995–2015' },
  { id: 'mf-scholes', name: 'P. Scholes', pos: 'MID', att: 85, def: 70, rating: 89, era: '1994–2013' },
  { id: 'mf-keane', name: 'R. Keane', pos: 'MID', att: 74, def: 86, rating: 89, era: '1992–2006' },
  { id: 'mf-vieira', name: 'P. Vieira', pos: 'MID', att: 76, def: 87, rating: 89, era: '1996–2005' },
  { id: 'mf-silva', name: 'D. Silva', pos: 'MID', att: 89, def: 58, rating: 89, era: '2010–2020' },
  { id: 'mf-hazard', name: 'E. Hazard', pos: 'MID', att: 90, def: 48, rating: 89, era: '2012–2019' },
  { id: 'mf-fabregas', name: 'C. Fàbregas', pos: 'MID', att: 86, def: 60, rating: 87, era: '2003–2019' },
  { id: 'mf-yaya', name: 'Y. Touré', pos: 'MID', att: 82, def: 74, rating: 87, era: '2010–2018' },
  { id: 'mf-cantona', name: 'É. Cantona', pos: 'MID', att: 90, def: 42, rating: 89, era: '1992–1997' },
  { id: 'mf-bergkamp', name: 'D. Bergkamp', pos: 'MID', att: 91, def: 40, rating: 89, era: '1995–2006' },
  { id: 'mf-giggs', name: 'R. Giggs', pos: 'MID', att: 83, def: 55, rating: 87, era: '1992–2014' },
  { id: 'mf-mata', name: 'J. Mata', pos: 'MID', att: 80, def: 50, rating: 82, era: '2011–2023' },

  // ── Forwards ─────────────────────────────────────────────────
  { id: 'fw-henry', name: 'T. Henry', pos: 'FWD', att: 95, def: 32, rating: 93, era: '1999–2012' },
  { id: 'fw-shearer', name: 'A. Shearer', pos: 'FWD', att: 93, def: 30, rating: 91, era: '1992–2006' },
  { id: 'fw-aguero', name: 'S. Agüero', pos: 'FWD', att: 93, def: 26, rating: 90, era: '2011–2021' },
  { id: 'fw-ronaldo', name: 'C. Ronaldo', pos: 'FWD', att: 94, def: 34, rating: 92, era: '2003–2009' },
  { id: 'fw-rooney', name: 'W. Rooney', pos: 'FWD', att: 90, def: 46, rating: 90, era: '2002–2018' },
  { id: 'fw-suarez', name: 'L. Suárez', pos: 'FWD', att: 92, def: 38, rating: 89, era: '2011–2014' },
  { id: 'fw-drogba', name: 'D. Drogba', pos: 'FWD', att: 90, def: 40, rating: 88, era: '2004–2015' },
  { id: 'fw-salah', name: 'M. Salah', pos: 'FWD', att: 92, def: 36, rating: 90, era: '2017–' },
  { id: 'fw-kane', name: 'H. Kane', pos: 'FWD', att: 91, def: 42, rating: 89, era: '2013–2023' },
  { id: 'fw-vannistelrooy', name: 'R. van Nistelrooy', pos: 'FWD', att: 91, def: 24, rating: 88, era: '2001–2006' },
  { id: 'fw-owen', name: 'M. Owen', pos: 'FWD', att: 88, def: 24, rating: 86, era: '1996–2013' },
  { id: 'fw-fowler', name: 'R. Fowler', pos: 'FWD', att: 87, def: 26, rating: 85, era: '1993–2009' },

  // ── Tier 2: solid PL regulars (quality gradient for the draft) ────
  // GK
  { id: 'gk-lloris', name: 'H. Lloris', pos: 'GK', att: 9, def: 80, rating: 80, era: '2012–2024' },
  { id: 'gk-given', name: 'S. Given', pos: 'GK', att: 8, def: 78, rating: 78, era: '1997–2017' },
  { id: 'gk-howard', name: 'T. Howard', pos: 'GK', att: 9, def: 77, rating: 77, era: '2003–2016' },
  { id: 'gk-robinson', name: 'P. Robinson', pos: 'GK', att: 8, def: 76, rating: 76, era: '2003–2017' },
  { id: 'gk-james', name: 'D. James', pos: 'GK', att: 8, def: 75, rating: 75, era: '1992–2010' },
  // DEF
  { id: 'df-evra', name: 'P. Evra', pos: 'DEF', att: 64, def: 80, rating: 80, era: '2006–2017' },
  { id: 'df-gallas', name: 'W. Gallas', pos: 'DEF', att: 50, def: 80, rating: 79, era: '2001–2013' },
  { id: 'df-zabaleta', name: 'P. Zabaleta', pos: 'DEF', att: 62, def: 79, rating: 78, era: '2008–2020' },
  { id: 'df-coleman', name: 'S. Coleman', pos: 'DEF', att: 66, def: 76, rating: 77, era: '2009–2024' },
  { id: 'df-ktoure', name: 'K. Touré', pos: 'DEF', att: 44, def: 78, rating: 77, era: '2002–2017' },
  { id: 'df-shaw', name: 'L. Shaw', pos: 'DEF', att: 64, def: 77, rating: 77, era: '2012–' },
  { id: 'df-lescott', name: 'J. Lescott', pos: 'DEF', att: 48, def: 76, rating: 76, era: '2002–2017' },
  { id: 'df-distin', name: 'S. Distin', pos: 'DEF', att: 44, def: 75, rating: 74, era: '2002–2015' },
  { id: 'df-lauren', name: 'Lauren', pos: 'DEF', att: 58, def: 75, rating: 74, era: '2000–2008' },
  { id: 'df-mings', name: 'T. Mings', pos: 'DEF', att: 50, def: 73, rating: 72, era: '2015–' },
  // MID
  { id: 'mf-carrick', name: 'M. Carrick', pos: 'MID', att: 70, def: 78, rating: 80, era: '2004–2018' },
  { id: 'mf-milner', name: 'J. Milner', pos: 'MID', att: 72, def: 76, rating: 79, era: '2002–2024' },
  { id: 'mf-arteta', name: 'M. Arteta', pos: 'MID', att: 76, def: 66, rating: 78, era: '2004–2016' },
  { id: 'mf-nasri', name: 'S. Nasri', pos: 'MID', att: 80, def: 52, rating: 78, era: '2008–2017' },
  { id: 'mf-barry', name: 'G. Barry', pos: 'MID', att: 64, def: 76, rating: 76, era: '1998–2020' },
  { id: 'mf-parker', name: 'S. Parker', pos: 'MID', att: 64, def: 78, rating: 75, era: '2000–2017' },
  { id: 'mf-cabaye', name: 'Y. Cabaye', pos: 'MID', att: 74, def: 64, rating: 75, era: '2011–2018' },
  { id: 'mf-sissoko', name: 'M. Sissoko', pos: 'MID', att: 66, def: 70, rating: 73, era: '2013–2022' },
  { id: 'mf-sidwell', name: 'S. Sidwell', pos: 'MID', att: 58, def: 66, rating: 68, era: '2003–2018' },
  // FWD
  { id: 'fw-berbatov', name: 'D. Berbatov', pos: 'FWD', att: 84, def: 30, rating: 82, era: '2006–2015' },
  { id: 'fw-sheringham', name: 'T. Sheringham', pos: 'FWD', att: 82, def: 34, rating: 81, era: '1992–2007' },
  { id: 'fw-andycole', name: 'A. Cole', pos: 'FWD', att: 84, def: 22, rating: 82, era: '1993–2008' },
  { id: 'fw-anelka', name: 'N. Anelka', pos: 'FWD', att: 83, def: 28, rating: 81, era: '1997–2012' },
  { id: 'fw-defoe', name: 'J. Defoe', pos: 'FWD', att: 82, def: 22, rating: 80, era: '2001–2022' },
  { id: 'fw-bent', name: 'D. Bent', pos: 'FWD', att: 79, def: 22, rating: 78, era: '2005–2017' },
  { id: 'fw-crouch', name: 'P. Crouch', pos: 'FWD', att: 76, def: 30, rating: 75, era: '2000–2019' },
  { id: 'fw-heskey', name: 'E. Heskey', pos: 'FWD', att: 72, def: 38, rating: 73, era: '1995–2012' },
];

export const PLAYERS_BY_ID: Record<string, Player> = Object.fromEntries(
  PLAYERS.map((p) => [p.id, p]),
);

if (new Set(PLAYERS.map((p) => p.id)).size !== PLAYERS.length) {
  throw new Error('Duplicate player id detected');
}
