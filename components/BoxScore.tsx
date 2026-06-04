import type { Formation, Player, TeamStrength } from '@/lib/types';

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
          {label}
        </span>
        <span
          className="text-sm font-black tabular-nums"
          style={{ fontFamily: 'var(--font-numeral)', color }}
        >
          {value || '–'}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--fg)_10%,transparent)]">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

/** 7a0-style box score: attack/defense bars + a per-slot lineup list. */
export default function BoxScore({
  formation,
  placed,
  strength,
}: {
  formation: Formation;
  placed: Record<string, Player>;
  strength: TeamStrength;
}) {
  const filled = Object.keys(placed).length;

  return (
    <aside>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-muted)]">
        Box Score · <span className="tabular-nums">{filled}/11</span>
      </p>

      <div className="mt-4 space-y-3 border-b border-[var(--card-line)] pb-4">
        <Bar label="Attack" value={strength.attack} color="var(--color-accent-2)" />
        <Bar label="Defense" value={strength.defense} color="var(--color-accent-3)" />
      </div>

      <ul className="mt-1">
        {formation.lineup.map((slot) => {
          const p = placed[slot.id];
          return (
            <li
              key={slot.id}
              className="flex items-center gap-3 border-b border-[var(--card-line)] py-2 text-sm"
            >
              <span className="w-10 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                {slot.pos}
              </span>
              <span className={`flex-1 truncate ${p ? 'font-semibold' : 'text-[var(--color-muted)]'}`}>
                {p?.name ?? '—'}
              </span>
              {p && (
                <span
                  className="tabular-nums font-black"
                  style={{ fontFamily: 'var(--font-numeral)' }}
                >
                  {p.rating}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
