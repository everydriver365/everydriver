interface FindCarIconProps {
  className?: string;
}

export function FindCarIcon({ className }: FindCarIconProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" rx="26" fill="url(#findcar-bg)" />
      {/* Navigation pin */}
      <path
        d="M60 22 C44 22 32 34 32 48 C32 68 60 96 60 96 C60 96 88 68 88 48 C88 34 76 22 60 22 Z"
        fill="white"
      />
      {/* Inner circle */}
      <circle cx="60" cy="48" r="12" fill="#FF3B30" />
      <defs>
        <linearGradient id="findcar-bg" x1="60" y1="0" x2="60" y2="120">
          <stop offset="0%" stopColor="#FF3B30" />
          <stop offset="100%" stopColor="#CC2F26" />
        </linearGradient>
      </defs>
    </svg>
  );
}
