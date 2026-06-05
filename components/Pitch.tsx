'use client';
import type { Formation, Player } from '@/lib/types';
import { codeGroup } from '@/lib/data/formations';

function lastName(name: string): string {
  const parts = name.replace(/\.$/, '').split(/\s+/);
  return parts[parts.length - 1];
}

const RING: Record<string, string> = {
  GK: 'var(--color-accent-2)',
  DEF: 'var(--color-accent-3)',
  MID: '#c9b8d6',
  FWD: 'var(--color-accent)',
};

export default function Pitch({
  formation,
  placed,
  selectedSlotId,
  targetSlotId,
  highlightSlotIds = [],
  onSlotClick,
  staggerMs = 0,
}: {
  formation: Formation;
  placed: Record<string, Player>;
  selectedSlotId?: string | null;
  targetSlotId?: string | null;
  highlightSlotIds?: string[];
  onSlotClick?: (slotId: string) => void;
  /** When > 0, placed tokens pop in one-by-one (used on the result reveal). */
  staggerMs?: number;
}) {
  const interactive = !!onSlotClick;
  return (
    <div
      aria-hidden={interactive ? undefined : true}
      className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/30 lg:max-w-lg"
      style={{
        background:
          // mowed stripes over a lit base
          'repeating-linear-gradient(180deg, rgba(255,255,255,0.05) 0 8.33%, rgba(0,0,0,0.05) 8.33% 16.66%), linear-gradient(170deg, #15894f 0%, #0f7341 45%, #0a5733 100%)',
      }}
    >
      {/* depth: top light + edge vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(120% 75% at 50% -10%, rgba(255,255,255,0.10), transparent 55%)' }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: 'inset 0 0 90px rgba(0,0,0,0.40)' }}
      />
      {/* pitch markings */}
      <div className="pointer-events-none absolute inset-3 rounded-lg border border-white/30" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40" />
      <div className="pointer-events-none absolute left-3 right-3 top-1/2 border-t border-white/30" />
      {/* penalty boxes + 6-yard */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 h-[14%] w-[55%] -translate-x-1/2 rounded-t-sm border-x border-t border-white/25" />
      <div className="pointer-events-none absolute top-3 left-1/2 h-[14%] w-[55%] -translate-x-1/2 rounded-b-sm border-x border-b border-white/25" />
      <div className="pointer-events-none absolute bottom-3 left-1/2 h-[6%] w-[28%] -translate-x-1/2 rounded-t-sm border-x border-t border-white/20" />
      <div className="pointer-events-none absolute top-3 left-1/2 h-[6%] w-[28%] -translate-x-1/2 rounded-b-sm border-x border-b border-white/20" />

      {formation.lineup.map((slot, i) => {
        const player = placed[slot.id];
        const isSelected = selectedSlotId === slot.id;
        const isTarget = targetSlotId === slot.id;
        const isHighlight = highlightSlotIds.includes(slot.id);
        return (
          <button
            key={slot.id}
            data-testid={`slot-${slot.id}`}
            onClick={() => onSlotClick?.(slot.id)}
            tabIndex={interactive ? undefined : -1}
            aria-pressed={player ? isSelected : isTarget}
            aria-label={
              player
                ? `${slot.pos}: ${player.name}, rating ${player.rating}${isSelected ? ', selected' : ''}${isHighlight ? ', swap target' : ''}`
                : `${slot.pos} slot, empty${isTarget ? ', selected — choose a player' : isHighlight ? ', valid move target' : ''}`
            }
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 transition-transform active:scale-95"
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
          >
            <span
              key={player?.id ?? slot.id}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-[10px] font-bold transition-all lg:h-11 lg:w-11 ${
                player
                  ? 'animate-pop-in text-[#0c101c]'
                  : 'border border-dashed border-white/70 text-white/85'
              } ${isSelected ? 'ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-transparent' : ''} ${
                isTarget ? 'ring-2 ring-[var(--color-accent)] scale-110 bg-[color-mix(in_srgb,var(--color-accent)_25%,transparent)]' : ''
              } ${
                isHighlight ? 'ring-2 ring-[var(--color-accent-3)] scale-110' : ''
              }`}
              style={
                player
                  ? {
                      background: 'radial-gradient(circle at 50% 30%, #ffffff, #e9e6ef)',
                      boxShadow:
                        isSelected || isHighlight
                          ? '0 2px 6px rgba(0,0,0,0.4)'
                          : `0 0 0 2.5px ${RING[codeGroup(slot.pos)]}, 0 2px 6px rgba(0,0,0,0.45)`,
                      animationDelay: staggerMs ? `${i * staggerMs}ms` : undefined,
                    }
                  : undefined
              }
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
              className={`max-w-[52px] truncate rounded px-1 text-[8px] font-bold uppercase tracking-wide lg:max-w-[72px] lg:text-[9px] ${
                player ? 'bg-black/40 text-white' : 'text-white/75'
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
