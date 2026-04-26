import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  iconColor: string;
  iconBackground: string;
  value: string;
  label: string;
}

export function StatCard({
  icon: Icon,
  iconColor,
  iconBackground,
  value,
  label,
}: StatCardProps) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "0.5px solid #E5E5EA",
        borderRadius: 12,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: iconBackground,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
        }}
      >
        <Icon size={16} strokeWidth={2} color={iconColor} />
      </div>
      <p
        style={{
          fontSize: 18,
          fontWeight: 500,
          color: "#000000",
          letterSpacing: "-0.3px",
          margin: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 11, color: "#6E6E73", margin: "2px 0 0" }}>{label}</p>
    </div>
  );
}
