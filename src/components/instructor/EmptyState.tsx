import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  iconBg?: string;
  iconColor?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  iconBg = "#F1ECFA",
  iconColor = "#8A5BC9",
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center text-center"
      style={{
        background: "#FFFFFF",
        border: "0.5px solid #E5E5EA",
        borderRadius: 12,
        padding: "32px 16px",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={24} strokeWidth={2} color={iconColor} />
      </div>
      <div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: "#000000",
            letterSpacing: "-0.2px",
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 12,
              color: "#6E6E73",
              lineHeight: 1.4,
              marginTop: 4,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
