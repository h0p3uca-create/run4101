/**
 * Required attribution + non-affiliation notice.
 * - FIFA/EA-derived ratings: CC BY-NC-SA (non-commercial, attribution, share-alike)
 * - Results: openfootball/england (CC0)
 * No club crests, logos, kits or official marks are used.
 */
export default function Footer() {
  return (
    <footer className="mx-auto max-w-3xl px-6 py-8 text-center text-[11px] leading-relaxed text-[var(--color-muted)]">
      <p className="font-semibold">
        Runfor101 — an unofficial, non-commercial fan project.
      </p>
      <p className="mt-1">
        Not affiliated with, endorsed by, or sponsored by the Premier League,
        any club, or EA Sports. No club crests, logos, or marks are used.
      </p>
      <p className="mt-2">
        Player ratings derived from EA Sports FC / FIFA attributes
        (CC&nbsp;BY-NC-SA). Match results from{' '}
        <a
          className="underline hover:text-[var(--fg)]"
          href="https://github.com/openfootball/england"
          target="_blank"
          rel="noopener noreferrer"
        >
          openfootball/england
        </a>{' '}
        (CC0). Names used descriptively under fair use.
      </p>
    </footer>
  );
}
