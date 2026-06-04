'use client';
import type { Formation, Player } from '@/lib/types';

function lastName(name: string): string {
  const parts = name.replace(/\.$/, '').split(/\s+/);
  return parts[parts.length - 1];
}

export default function Pitch({
  formation,
  placed,
  selectedSlotId,
  highlightSlotIds = [],
  onSlotClick,
}: {
  formation: Formation;
  placed: Record<string, Player>;
  selectedSlotId?: string | null;
  highlightSlotIds?: string[];
  onSlotClick?: (slotId: string) => void;
}) {
  return (
    <div
      className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/20 lg:max-w-lg"
      style={{
        backgroundImage:
          'repeating-linear-gradient(180deg,#0e6b3f 0,#0e6b3f 8.33%,#0c5f37 8.33%,#0c5f37 16.66%)',
      }}
    >
      {/* pitch markings */}
      <div className="pointer-events-none absolute inset-3 rounded-lg border border-white/25" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25" />
      <div className="pointer-events-none absolute left-3 right-3 top-1/2 border-t border-white/25" />
      {/* penalty boxes */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 h-[14%] w-[55%] -translate-x-1/2 rounded-t-sm border-x border-t border-white/20" />
      <div className="pointer-events-none absolute top-3 left-1/2 h-[14%] w-[55%] -translate-x-1/2 rounded-b-sm border-x border-b border-white/20" />

      {formation.lineup.map((slot) => {
        const player = placed[slot.id];
        const isSelected = selectedSlotId === slot.id;
        const isHighlight = highlightSlotIds.includes(slot.id);
        return (
          <button
            key={slot.id}
            data-testid={`slot-${slot.id}`}
            onClick={() => onSlotClick?.(slot.id)}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 transition-transform active:scale-95"
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
          >
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-full text-[10px] font-bold transition-all ${
                player
                  ? 'bg-white text-[#0c101c] shadow-md'
                  : 'border border-dashed border-white/50 text-white/70'
              } ${isSelected ? 'ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-transparent' : ''} ${
                isHighlight ? 'ring-2 ring-[var(--color-accent-3)] scale-110' : ''
              }`}
            >
              {player ? (
                <span
                  className="tabular-nums font-black"
                  style={{ fontFamily: 'var(--font-numeral)' }}
                >
                  {player.rating}
                </span>
              ) : (
                slot.pos
              )}
            </span>
            <span
              className={`max-w-[72px] truncate rounded px-1 text-[9px] font-bold uppercase tracking-wide ${
                player ? 'bg-black/40 text-white' : 'text-white/60'
              }`}
            >
              {player ? lastName(player.name) : slot.pos}
            </span>
          </button>
        );
      })}
    </div>
  );
}
