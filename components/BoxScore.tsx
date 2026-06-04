import type { Formation, Player, Position, TeamStrength } from '@/lib/types';

const ORDER: Position[] = ['GK', 'DEF', 'MID', 'FWD'];

/** Per-slot lineup card with running attack/defense — the right-hand "box score". */
export default function BoxScore({
  formation,
  picks,
  strength,
}: {
  formation: Formation;
  picks: Player[];
  strength: TeamStrength;
}) {
  const rows: { pos: Position; player?: Player }[] = [];
  for (const pos of ORDER) {
    const filled = picks.filter((p) => p.pos === pos);
    for (let i = 0; i < formation.slots[pos]; i++) {
      rows.push({ pos, player: filled[i] });
    }
  }

  return (
    <aside className="rounded-2xl border border-[var(--card-line)] bg-[var(--card)] p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
          Box score · {picks.length}/11
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
        {rows.map((r, i) => (
          <li
            key={i}
            className="flex items-center gap-2 border-b border-[var(--card-line)]/40 py-1 text-sm last:border-0"
          >
            <span className="w-8 text-[10px] font-bold uppercase text-[var(--color-muted)]">
              {r.pos}
            </span>
            <span className={`flex-1 truncate ${r.player ? 'font-medium' : 'text-[var(--color-muted)]'}`}>
              {r.player?.name ?? '—'}
            </span>
            {r.player && (
              <span
                className="tabular-nums font-bold text-[var(--color-accent)]"
                style={{ fontFamily: 'var(--font-numeral)' }}
              >
                {r.player.rating}
              </span>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
