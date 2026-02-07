interface PaymentsIconProps {
  className?: string;
}

export function PaymentsIcon({ className }: PaymentsIconProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" rx="26" fill="url(#payments-bg)" />
      {/* Pound sign */}
      <text
        x="60"
        y="72"
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize="52"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        £
      </text>
      <defs>
        <linearGradient id="payments-bg" x1="60" y1="0" x2="60" y2="120">
          <stop offset="0%" stopColor="#34C759" />
          <stop offset="100%" stopColor="#248A3D" />
        </linearGradient>
      </defs>
    </svg>
  );
}
