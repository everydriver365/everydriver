interface AwardIconProps {
  className?: string;
}

export function AwardIcon({ className }: AwardIconProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" rx="26" fill="url(#award-bg)" />
      {/* Trophy cup */}
      <path
        d="M42 34 H78 V56 C78 68 70 76 60 76 C50 76 42 68 42 56 V34 Z"
        fill="white"
      />
      {/* Left handle */}
      <path d="M42 40 C32 40 28 48 32 56 L42 54" stroke="white" strokeWidth="4" fill="none" />
      {/* Right handle */}
      <path d="M78 40 C88 40 92 48 88 56 L78 54" stroke="white" strokeWidth="4" fill="none" />
      {/* Base */}
      <rect x="50" y="76" width="20" height="4" rx="1" fill="white" />
      <rect x="44" y="80" width="32" height="6" rx="2" fill="white" />
      <defs>
        <linearGradient id="award-bg" x1="60" y1="0" x2="60" y2="120">
          <stop offset="0%" stopColor="#30B0C7" />
          <stop offset="100%" stopColor="#1F8A9E" />
        </linearGradient>
      </defs>
    </svg>
  );
}
