interface CalendarIconProps {
  day?: number;
  className?: string;
}

export function CalendarIcon({ day, className }: CalendarIconProps) {
  const displayDay = day ?? new Date().getDate();

  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Blue top bar */}
      <rect x="4" y="4" width="40" height="12" rx="2" fill="#4285F4" />
      {/* Red accent (right edge) */}
      <rect x="36" y="16" width="8" height="14" fill="#EA4335" />
      {/* Yellow accent (bottom-right) */}
      <rect x="36" y="30" width="8" height="14" rx="0 0 2 0" fill="#FBBC04" />
      {/* Green accent (bottom) */}
      <rect x="4" y="36" width="32" height="8" rx="0 0 0 2" fill="#34A853" />
      {/* White center */}
      <rect x="4" y="16" width="32" height="20" fill="white" />
      {/* Day number */}
      <text
        x="20"
        y="33"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#70757A"
        fontSize="18"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {displayDay}
      </text>
    </svg>
  );
}
