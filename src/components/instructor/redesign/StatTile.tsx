interface StatTileProps {
  label: string;
  value: string | number;
  caption: string;
  urgent?: boolean;
  onClick?: () => void;
}

export function StatTile({ label, value, caption, urgent, onClick }: StatTileProps) {
  return (
    <button
      onClick={onClick}
      className="relative text-left"
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: "10px 12px",
        border: urgent ? "1.5px solid #D12E2E" : "1px solid rgba(10,14,39,0.05)",
        minHeight: 76,
      }}
    >
      {urgent && (
        <span
          className="absolute"
          style={{
            top: 8,
            right: 8,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#D12E2E",
            animation: "pulse 1.6s ease-in-out infinite",
          }}
        />
      )}
      <div
        style={{
          fontSize: 10,
          letterSpacing: 0.3,
          fontWeight: 600,
          textTransform: "uppercase",
          color: urgent ? "#D12E2E" : "#888",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: "#0a0e27",
          marginTop: 4,
          lineHeight: 1.1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: "#5F5E5A", marginTop: 2 }}>{caption}</div>
    </button>
  );
}
