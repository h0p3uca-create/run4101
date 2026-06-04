import type { Player, Position } from '@/lib/types';

export const POS_COLOR: Record<Position, string> = {
  GK: 'var(--color-accent-2)',
  DEF: 'var(--color-accent-3)',
  MID: 'var(--color-paper)',
  FWD: 'var(--color-accent)',
};

export function PosBadge({ pos }: { pos: Position }) {
  return (
    <span
      className="inline-flex h-5 w-9 items-center justify-center rounded text-[10px] font-bold tracking-wider"
      style={{ background: POS_COLOR[pos], color: '#1a0a1c' }}
    >
      {pos}
    </span>
  );
}

export function RatingPill({ value }: { value: number }) {
  return (
    <span
      className="inline-flex h-6 w-7 items-center justify-center rounded text-xs font-bold tabular-nums"
      style={{
        fontFamily: 'var(--font-numeral)',
        background: 'color-mix(in srgb, var(--fg) 12%, transparent)',
      }}
    >
      {value}
    </span>
  );
}

export default function PlayerChip({
  player,
  onPick,
  disabled,
}: {
  player: Player;
  onPick?: (id: string) => void;
  disabled?: boolean;
}) {
  const interactive = !!onPick && !disabled;
  return (
    <button
      type="button"
      data-testid={`pick-${player.id}`}
      disabled={!interactive}
      onClick={() => onPick?.(player.id)}
      className={`flex w-full items-center gap-2 rounded-[var(--radius)] border px-2 py-1.5 text-left transition-colors ${
        interactive
          ? 'border-[var(--card-line)] hover:border-[var(--color-accent)] hover:bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] cursor-pointer'
          : 'border-transparent opacity-40'
      }`}
    >
      <PosBadge pos={player.pos} />
      <span className="flex-1 truncate text-sm font-medium">{player.name}</span>
      <span className="hidden max-w-[90px] truncate text-[10px] text-[var(--color-muted)] sm:inline">
        {player.club ?? player.era}
      </span>
      <RatingPill value={player.rating} />
    </button>
  );
}
