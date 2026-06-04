'use client';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="rounded-full border border-[var(--card-line)] px-3 py-1 text-xs uppercase tracking-widest text-[var(--color-muted)] hover:text-[var(--fg)] transition-colors"
      aria-label="Toggle theme"
    >
      {dark ? '◑ Dark' : '◐ Light'}
    </button>
  );
}
