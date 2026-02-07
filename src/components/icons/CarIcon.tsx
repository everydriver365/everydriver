interface CarIconProps {
  className?: string;
}

export function CarIcon({ className }: CarIconProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" rx="26" fill="url(#car-bg)" />
      {/* Car body */}
      <path
        d="M26 68 L34 50 C36 46 40 44 44 44 H76 C80 44 84 46 86 50 L94 68 H26 Z"
        fill="white"
      />
      <rect x="22" y="66" width="76" height="20" rx="4" fill="white" />
      {/* Windows */}
      <path d="M38 52 L42 44 H58 V52 Z" fill="#32ADE6" />
      <path d="M62 44 H78 L82 52 H62 Z" fill="#32ADE6" />
      {/* Wheels */}
      <circle cx="38" cy="86" r="8" fill="white" />
      <circle cx="38" cy="86" r="4" fill="#32ADE6" />
      <circle cx="82" cy="86" r="8" fill="white" />
      <circle cx="82" cy="86" r="4" fill="#32ADE6" />
      <defs>
        <linearGradient id="car-bg" x1="60" y1="0" x2="60" y2="120">
          <stop offset="0%" stopColor="#32ADE6" />
          <stop offset="100%" stopColor="#1A8FC4" />
        </linearGradient>
      </defs>
    </svg>
  );
}
