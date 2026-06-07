// Muninn's "enhance" mark: a clean upward double-chevron reading as
// "lift / improve this prompt". Single-color (inherits currentColor) so it
// adapts to the accent in any context, and pairs with the Raven's line weight.
// (Deliberately not a sparkle — that glyph reads as generic AI.)

export function Spark({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 13l6-5 6 5" />
      <path d="M6 18l6-5 6 5" />
    </svg>
  );
}
