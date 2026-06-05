'use client';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Adopt whatever the pre-hydration script (app/layout.tsx) already applied —
  // never re-toggle the class on mount, so there's no flash.
  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  // After mount, reflect user toggles to the DOM + persist.
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('runfor101-theme', dark ? 'dark' : 'light');
    } catch {
      /* private mode — ignore */
    }
  }, [dark, mounted]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--card-line)] px-3 text-xs uppercase tracking-widest text-[var(--color-muted)] transition-colors hover:text-[var(--fg)]"
      aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`}
    >
      <span suppressHydrationWarning>
        <span aria-hidden="true">{dark ? '◑' : '◐'}</span> {dark ? 'Dark' : 'Light'}
      </span>
    </button>
  );
}
