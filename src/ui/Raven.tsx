// Muninn's mark: a minimal raven head in profile. Tasteful, single-color,
// inherits currentColor so it adapts to the accent in any context.

export function Raven({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* head + curved beak */}
      <path
        d="M5 14c0-4.4 3.4-8 7.6-8 2.2 0 3.6.9 4.4 1.8.9 1 2.3 1.1 3.4.7l1.1-.4-.7 1.6c-.5 1.1-1.5 1.7-2.6 1.8.2.7.3 1.5.3 2.3 0 4-3 6.8-7 6.8-1.4 0-2.6-.3-3.6-.9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* eye */}
      <circle cx="9.5" cy="11" r="1.1" fill="currentColor" />
      {/* throat / breast accent */}
      <path
        d="M6 18c-1.2.2-2.4 0-3.4-.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
