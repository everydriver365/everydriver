interface ExpensesIconProps {
  className?: string;
}

export function ExpensesIcon({ className }: ExpensesIconProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" rx="26" fill="url(#expenses-bg)" />
      {/* Receipt shape */}
      <path
        d="M36 28 H84 V88 L78 84 L72 88 L66 84 L60 88 L54 84 L48 88 L42 84 L36 88 Z"
        fill="white"
      />
      {/* Lines on receipt */}
      <line x1="46" y1="46" x2="74" y2="46" stroke="#FF2D55" strokeWidth="3" strokeLinecap="round" />
      <line x1="46" y1="56" x2="74" y2="56" stroke="#FF2D55" strokeWidth="3" strokeLinecap="round" />
      <line x1="46" y1="66" x2="64" y2="66" stroke="#FF2D55" strokeWidth="3" strokeLinecap="round" />
      <defs>
        <linearGradient id="expenses-bg" x1="60" y1="0" x2="60" y2="120">
          <stop offset="0%" stopColor="#FF2D55" />
          <stop offset="100%" stopColor="#D4234A" />
        </linearGradient>
      </defs>
    </svg>
  );
}
