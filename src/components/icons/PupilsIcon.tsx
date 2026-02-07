interface PupilsIconProps {
  className?: string;
}

export function PupilsIcon({ className }: PupilsIconProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" rx="26" fill="url(#pupils-bg)" />
      {/* Front person */}
      <circle cx="52" cy="42" r="12" fill="white" />
      <path d="M32 78 C32 64 42 56 52 56 C62 56 72 64 72 78" fill="white" />
      {/* Back person */}
      <circle cx="74" cy="38" r="10" fill="white" fillOpacity="0.7" />
      <path d="M58 72 C58 60 66 53 74 53 C82 53 90 60 90 72" fill="white" fillOpacity="0.7" />
      <defs>
        <linearGradient id="pupils-bg" x1="60" y1="0" x2="60" y2="120">
          <stop offset="0%" stopColor="#007AFF" />
          <stop offset="100%" stopColor="#0055D4" />
        </linearGradient>
      </defs>
    </svg>
  );
}
