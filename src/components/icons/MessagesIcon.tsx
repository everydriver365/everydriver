interface MessagesIconProps {
  className?: string;
}

export function MessagesIcon({ className }: MessagesIconProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background */}
      <rect width="120" height="120" rx="26" fill="url(#messages-bg)" />
      
      {/* Chat bubble */}
      <ellipse cx="60" cy="55" rx="30" ry="24" fill="white" />
      
      {/* Bubble tail */}
      <path
        d="M38 70 C38 70 30 82 28 86 C28 86 40 78 44 75 Z"
        fill="white"
      />
      
      <defs>
        <linearGradient id="messages-bg" x1="60" y1="0" x2="60" y2="120">
          <stop offset="0%" stopColor="#5EF38C" />
          <stop offset="100%" stopColor="#1B9B3E" />
        </linearGradient>
      </defs>
    </svg>
  );
}
