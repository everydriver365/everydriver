interface SettingsIconProps {
  className?: string;
}

export function SettingsIcon({ className }: SettingsIconProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background */}
      <rect width="120" height="120" rx="26" fill="url(#settings-bg)" />
      
      {/* Outer gear */}
      <g transform="translate(60,60)">
        {/* Gear teeth - outer ring */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 15) * Math.PI / 180;
          const innerR = 34;
          const outerR = 40;
          const x1 = Math.cos(angle) * innerR;
          const y1 = Math.sin(angle) * innerR;
          const x2 = Math.cos(angle) * outerR;
          const y2 = Math.sin(angle) * outerR;
          return (
            <line
              key={`tooth-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#636366"
              strokeWidth="4"
              strokeLinecap="round"
            />
          );
        })}
        
        {/* Outer ring */}
        <circle cx="0" cy="0" r="34" stroke="#636366" strokeWidth="5" fill="none" />
        
        {/* Inner gear body */}
        <circle cx="0" cy="0" r="26" fill="#636366" />
        
        {/* Center hub - three-lobed shape */}
        <path
          d="M0,-12 C4,-12 8,-6 8,0 C8,6 4,12 0,12 C-4,12 -8,6 -8,0 C-8,-6 -4,-12 0,-12Z"
          fill="#AEAEB2"
          transform="rotate(0)"
        />
        <path
          d="M0,-12 C4,-12 8,-6 8,0 C8,6 4,12 0,12 C-4,12 -8,6 -8,0 C-8,-6 -4,-12 0,-12Z"
          fill="#AEAEB2"
          transform="rotate(120)"
        />
        <path
          d="M0,-12 C4,-12 8,-6 8,0 C8,6 4,12 0,12 C-4,12 -8,6 -8,0 C-8,-6 -4,-12 0,-12Z"
          fill="#AEAEB2"
          transform="rotate(240)"
        />
        
        {/* Center circle */}
        <circle cx="0" cy="0" r="6" fill="#AEAEB2" />
        <circle cx="0" cy="0" r="3" fill="#636366" />
      </g>
      
      <defs>
        <linearGradient id="settings-bg" x1="0" y1="0" x2="0" y2="120">
          <stop offset="0%" stopColor="#8E8E93" />
          <stop offset="100%" stopColor="#636366" />
        </linearGradient>
      </defs>
    </svg>
  );
}
