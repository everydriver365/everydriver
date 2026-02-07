interface JobOffersIconProps {
  className?: string;
}

export function JobOffersIcon({ className }: JobOffersIconProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" rx="26" fill="url(#joboffers-bg)" />
      {/* Briefcase body */}
      <rect x="24" y="48" width="72" height="40" rx="6" fill="white" />
      {/* Handle */}
      <path d="M44 48 V40 C44 36 48 32 52 32 H68 C72 32 76 36 76 40 V48" stroke="white" strokeWidth="5" fill="none" />
      {/* Center clasp */}
      <rect x="54" y="58" width="12" height="10" rx="2" fill="#AF52DE" />
      <defs>
        <linearGradient id="joboffers-bg" x1="60" y1="0" x2="60" y2="120">
          <stop offset="0%" stopColor="#AF52DE" />
          <stop offset="100%" stopColor="#8B3FC1" />
        </linearGradient>
      </defs>
    </svg>
  );
}
