import { Link } from "react-router-dom";

interface Props {
  monthEarnings: number;
  paymentsCount?: number;
  outstanding: number;
  outstandingCount?: number;
}

export function MoneyStack({ monthEarnings, paymentsCount = 0, outstanding, outstandingCount = 0 }: Props) {
  const fmt = (n: number) =>
    `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* This month */}
      <div
        style={{
          background: "var(--d2-emerald-bg)",
          border: "0.5px solid rgba(16,185,129,0.20)",
          borderRadius: 12,
          padding: 14,
          flex: 1,
        }}
      >
        <p
          style={{
            fontSize: 10, fontWeight: 600,
            letterSpacing: "0.6px", textTransform: "uppercase",
            color: "var(--d2-emerald-fg)", opacity: 0.85,
            margin: "0 0 6px",
          }}
        >
          This Month
        </p>
        <p
          className="d2-mono"
          style={{
            fontSize: 22, fontWeight: 500,
            color: "var(--d2-emerald-fg)",
            margin: "0 0 4px", letterSpacing: "-0.4px",
          }}
        >
          {fmt(monthEarnings)}
        </p>
        <p style={{ fontSize: 11, color: "var(--d2-emerald-fg)", opacity: 0.75, margin: 0 }}>
          {paymentsCount} payments received
        </p>
      </div>

      {/* Outstanding */}
      <div
        style={{
          background: "var(--d2-rose-bg)",
          border: "0.5px solid rgba(244,63,94,0.20)",
          borderRadius: 12,
          padding: 14,
          flex: 1,
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
          <p
            style={{
              fontSize: 10, fontWeight: 600,
              letterSpacing: "0.6px", textTransform: "uppercase",
              color: "var(--d2-rose-fg)", opacity: 0.85,
              margin: 0,
            }}
          >
            Outstanding
          </p>
          <Link
            to="/instructor/send-reminder"
            style={{ fontSize: 11, color: "var(--d2-rose-fg)", fontWeight: 500 }}
          >
            Send reminders →
          </Link>
        </div>
        <p
          className="d2-mono"
          style={{
            fontSize: 22, fontWeight: 500,
            color: "var(--d2-rose-fg)",
            margin: "0 0 4px", letterSpacing: "-0.4px",
          }}
        >
          {fmt(outstanding)}
        </p>
        <p style={{ fontSize: 11, color: "var(--d2-rose-fg)", opacity: 0.75, margin: 0 }}>
          {outstandingCount} pupils owe money
        </p>
      </div>
    </div>
  );
}
