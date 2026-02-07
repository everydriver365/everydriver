interface AvailabilityIconProps {
  className?: string;
}

export function AvailabilityIcon({ className }: AvailabilityIconProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" rx="26" fill="url(#avail-bg)" />
      {/* Clock face */}
      <circle cx="60" cy="60" r="30" stroke="white" strokeWidth="5" fill="none" />
      {/* Hour hand */}
      <line x1="60" y1="60" x2="60" y2="40" stroke="white" strokeWidth="5" strokeLinecap="round" />
      {/* Minute hand */}
      <line x1="60" y1="60" x2="76" y2="60" stroke="white" strokeWidth="4" strokeLinecap="round" />
      {/* Center dot */}
      <circle cx="60" cy="60" r="3" fill="white" />
      <defs>
        <linearGradient id="avail-bg" x1="60" y1="0" x2="60" y2="120">
          <stop offset="0%" stopColor="#FF9500" />
          <stop offset="100%" stopColor="#CC7700" />
        </linearGradient>
      </defs>
    </svg>
  );
}
