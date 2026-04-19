import { ChevronRight, type LucideIcon } from "lucide-react";

interface RowCardProps {
  accentColor: string;
  iconBg: string;
  iconColor: string;
  Icon: LucideIcon;
  title: string;
  caption: string;
  pillValue: string | number;
  pillBg: string;
  pillFg: string;
  onClick?: () => void;
}

export function RowCard({
  accentColor,
  iconBg,
  iconColor,
  Icon,
  title,
  caption,
  pillValue,
  pillBg,
  pillFg,
  onClick,
}: RowCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 text-left"
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: "12px",
        borderLeft: `3px solid ${accentColor}`,
        border: `1px solid rgba(10,14,39,0.05)`,
        borderLeftWidth: 3,
        borderLeftColor: accentColor,
      }}
    >
      <div
        className="flex items-center justify-center shrink-0"
        style={{ width: 36, height: 36, borderRadius: 8, background: iconBg }}
      >
        <Icon className="h-[18px] w-[18px]" color={iconColor} strokeWidth={2.2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span style={{ fontSize: 13, fontWeight: 500, color: "#0a0e27" }}>{title}</span>
          <span
            style={{
              background: pillBg,
              color: pillFg,
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 999,
              minWidth: 24,
              textAlign: "center",
            }}
          >
            {pillValue}
          </span>
        </div>
        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{caption}</div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0" color="#c5c8d1" strokeWidth={2} />
    </button>
  );
}
