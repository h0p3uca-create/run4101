import type { Formation, Player, Position } from '@/lib/types';
import { PosBadge } from './PlayerChip';

const ROWS: Position[] = ['FWD', 'MID', 'DEF', 'GK'];

function Slot({ player }: { player?: Player }) {
  if (!player) {
    return (
      <div className="flex h-12 w-20 sm:w-24 items-center justify-center rounded-[var(--radius)] border border-dashed border-white/25 text-[10px] uppercase tracking-wider text-white/40">
        empty
      </div>
    );
  }
  return (
    <div className="flex h-12 w-20 sm:w-24 flex-col items-center justify-center gap-0.5 rounded-[var(--radius)] bg-black/30 px-1 text-center ring-1 ring-white/15">
      <span className="truncate text-[11px] font-semibold leading-tight text-white w-full">
        {player.name}
      </span>
      <span
        className="text-[9px] font-bold tabular-nums"
        style={{ fontFamily: 'var(--font-numeral)', color: 'var(--color-accent)' }}
      >
        {player.rating}
      </span>
    </div>
  );
}

/** Football pitch showing the XI by formation row, GK at the back. */
export default function Pitch({
  formation,
  xi,
}: {
  formation: Formation;
  xi: Player[];
}) {
  const byPos = (pos: Position) => xi.filter((p) => p.pos === pos);

  return (
    <div
      className="relative rounded-2xl p-4 sm:p-6"
      style={{
        background:
          'linear-gradient(180deg, var(--color-pl-purple-2), var(--color-pl-purple))',
      }}
    >
      <div className="flex flex-col gap-3 sm:gap-5">
        {ROWS.map((pos) => {
          const count = formation.slots[pos];
          const filled = byPos(pos);
          return (
            <div key={pos} className="flex items-center justify-center gap-2 sm:gap-3">
              <span className="absolute left-3 hidden sm:block">
                <PosBadge pos={pos} />
              </span>
              {Array.from({ length: count }).map((_, i) => (
                <Slot key={i} player={filled[i]} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
