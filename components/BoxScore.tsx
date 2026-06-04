import type { Formation, Player, TeamStrength } from '@/lib/types';

/** Per-slot lineup card with running attack/defense — the right-hand "box score". */
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
    <aside className="rounded-2xl border border-[var(--card-line)] bg-[var(--card)] p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
          Box score · {filled}/11
        </span>
      </div>

      <div className="mb-3 flex gap-4 border-b border-[var(--card-line)] pb-3">
        <span className="text-sm">
          <span
            className="text-xl font-black tabular-nums text-[var(--color-accent-2)]"
            style={{ fontFamily: 'var(--font-numeral)' }}
          >
            {strength.attack || '–'}
          </span>{' '}
          <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
            attack
          </span>
        </span>
        <span className="text-sm">
          <span
            className="text-xl font-black tabular-nums text-[var(--color-accent-3)]"
            style={{ fontFamily: 'var(--font-numeral)' }}
          >
            {strength.defense || '–'}
          </span>{' '}
          <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
            defense
          </span>
        </span>
      </div>

      <ul className="space-y-1">
        {formation.lineup.map((slot) => {
          const p = placed[slot.id];
          return (
            <li
              key={slot.id}
              className="flex items-center gap-2 border-b border-[var(--card-line)]/40 py-1 text-sm last:border-0"
            >
              <span className="w-9 text-[10px] font-bold uppercase text-[var(--color-muted)]">
                {slot.pos}
              </span>
              <span className={`flex-1 truncate ${p ? 'font-medium' : 'text-[var(--color-muted)]'}`}>
                {p?.name ?? '—'}
              </span>
              {p && (
                <span
                  className="tabular-nums font-bold text-[var(--color-accent)]"
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
