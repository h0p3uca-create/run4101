'use client';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  // Restore persisted preference on mount.
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gofor101-theme');
      if (saved === 'light') setDark(false);
      else if (saved === 'dark') setDark(true);
    } catch {
      /* localStorage unavailable (private mode) — fall back to default */
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('gofor101-theme', dark ? 'dark' : 'light');
    } catch {
      /* ignore persistence failure */
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="rounded-full border border-[var(--card-line)] px-3 py-1 text-xs uppercase tracking-widest text-[var(--color-muted)] hover:text-[var(--fg)] transition-colors"
      aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`}
    >
      {dark ? '◑ Dark' : '◐ Light'}
    </button>
  );
}
