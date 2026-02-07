interface TodoIconProps {
  className?: string;
}

export function TodoIcon({ className }: TodoIconProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" rx="26" fill="url(#todo-bg)" />
      {/* Checkmark 1 */}
      <path d="M30 42 L38 50 L52 34" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Line 1 */}
      <line x1="60" y1="42" x2="90" y2="42" stroke="white" strokeWidth="4" strokeLinecap="round" />
      {/* Checkmark 2 */}
      <path d="M30 62 L38 70 L52 54" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Line 2 */}
      <line x1="60" y1="62" x2="90" y2="62" stroke="white" strokeWidth="4" strokeLinecap="round" />
      {/* Empty box 3 */}
      <rect x="30" y="76" width="16" height="16" rx="3" stroke="white" strokeWidth="3" fill="none" />
      {/* Line 3 */}
      <line x1="60" y1="84" x2="82" y2="84" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      <defs>
        <linearGradient id="todo-bg" x1="60" y1="0" x2="60" y2="120">
          <stop offset="0%" stopColor="#5856D6" />
          <stop offset="100%" stopColor="#4240A8" />
        </linearGradient>
      </defs>
    </svg>
  );
}
