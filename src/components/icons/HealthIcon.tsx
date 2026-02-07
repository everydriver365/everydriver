interface HealthIconProps {
  className?: string;
}

export function HealthIcon({ className }: HealthIconProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" rx="26" fill="url(#health-bg)" />
      {/* Heart */}
      <path
        d="M60 88 C56 84 28 66 28 48 C28 36 36 28 48 28 C54 28 58 32 60 36 C62 32 66 28 72 28 C84 28 92 36 92 48 C92 66 64 84 60 88 Z"
        fill="white"
      />
      <defs>
        <linearGradient id="health-bg" x1="60" y1="0" x2="60" y2="120">
          <stop offset="0%" stopColor="#FF2D55" />
          <stop offset="100%" stopColor="#E0245E" />
        </linearGradient>
      </defs>
    </svg>
  );
}
