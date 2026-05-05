import { LineChart, Line, ResponsiveContainer } from "recharts";

interface Props {
  label: string;
  value: string | number;
  data?: number[];
  color?: string;
  onClick?: () => void;
}

export function StatCardV2({ label, value, data, color = "#94A3B8", onClick }: Props) {
  const chartData = (data && data.length ? data : [0, 0, 0, 0, 0, 0, 0]).map((v, i) => ({ i, v }));

  return (
    <button
      onClick={onClick}
      className="d2-card text-left transition-colors"
      style={{
        padding: 16,
        background: "var(--d2-surface-soft)",
        cursor: onClick ? "pointer" : "default",
      }}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.background = "var(--d2-hover)")}
      onMouseLeave={(e) => onClick && (e.currentTarget.style.background = "var(--d2-surface-soft)")}
    >
      <p
        style={{
          fontSize: 11, fontWeight: 500,
          color: "var(--d2-text-3)",
          letterSpacing: "0.6px",
          textTransform: "uppercase",
          margin: "0 0 8px",
        }}
      >
        {label}
      </p>
      <p
        className="d2-mono"
        style={{
          fontSize: 26, fontWeight: 500,
          color: "var(--d2-text-1)",
          margin: "0 0 8px",
          letterSpacing: "-0.5px",
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
      <div style={{ height: 28 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </button>
  );
}
