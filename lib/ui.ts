// Shared visual helpers: position colours + rating "card" tones, so the pitch,
// pick list, box score and result lineup all grade players consistently.

/** Position group → accent colour. */
export function posColor(pos: string): string {
  switch (pos) {
    case 'GK': return 'var(--color-accent-2-ink)';
    case 'DEF': return 'var(--color-accent-3)';
    case 'MID': return 'var(--pos-mid)'; // theme-aware (lavender on dark, darker on paper)
    case 'FWD': return 'var(--color-accent)';
    default: return 'var(--color-muted)';
  }
}

export interface Tone { color: string; bg: string; ring: string; tier: string }

/** Grade a 0–99 overall into a coloured badge tone (FUT-style tiers). */
export function ratingTone(rating: number): Tone {
  if (rating >= 90)
    return {
      color: '#2a1400',
      bg: 'linear-gradient(135deg,#ffe08a,#f5a623)',
      ring: '#f5a623',
      tier: 'elite',
    };
  if (rating >= 84)
    return {
      color: 'var(--fg)',
      bg: 'color-mix(in srgb, var(--color-accent) 24%, transparent)',
      ring: 'var(--color-accent)',
      tier: 'great',
    };
  if (rating >= 76)
    return {
      color: 'var(--fg)',
      bg: 'color-mix(in srgb, var(--color-accent-3) 22%, transparent)',
      ring: 'var(--color-accent-3)',
      tier: 'good',
    };
  return {
    color: 'var(--color-muted)',
    bg: 'color-mix(in srgb, var(--fg) 8%, transparent)',
    ring: 'var(--card-line)',
    tier: 'squad',
  };
}
