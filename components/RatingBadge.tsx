import { ratingTone } from '@/lib/ui';

const DIMS = {
  sm: 'h-7 w-7 text-sm',
  md: 'h-9 w-9 text-base',
  lg: 'h-11 w-11 text-lg',
} as const;

/** Compact colour-graded rating square, shared across pick list / box score / result. */
export default function RatingBadge({
  rating,
  size = 'md',
}: {
  rating: number;
  size?: keyof typeof DIMS;
}) {
  const t = ratingTone(rating);
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-lg font-black tabular-nums ${DIMS[size]}`}
      style={{ background: t.bg, color: t.color, fontFamily: 'var(--font-numeral)' }}
    >
      {rating}
    </span>
  );
}
