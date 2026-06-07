// Muninn's mark: a minimal raven head. Single-color (inherits currentColor) so
// it adapts to the accent in any context. This is the exact mark shown in the
// design preview.

export function Raven({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* head + beak */}
      <path d="M3 11c0-3.3 2.7-6 6-6 2 0 3.4.9 4.4 2.2L21 6l-3 3.2c.4 1 .6 2 .6 3.1 0 .9-.2 1.8-.5 2.6" />
      {/* throat curve */}
      <path d="M3 11c.7 4 4 7 8.5 7 2.2 0 4-.6 5.6-1.6" />
      {/* eye */}
      <circle cx="8.5" cy="9.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
