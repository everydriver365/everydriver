import type { ReactNode } from "react";
import { DynamicIcon } from "./DynamicIcon";

interface Props {
  icon: string;
  iconBg: string;
  iconColour: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function SettingsGroup({ icon, iconBg, iconColour, title, subtitle, children }: Props) {
  return (
    <div
      style={{
        backgroundColor: "#FFF",
        borderRadius: 14,
        border: "1px solid #DDE3ED",
        overflow: "hidden",
        boxShadow: "0 1px 6px rgba(15,32,68,0.04)",
        marginBottom: 18,
      }}
    >
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid #F2F4F8",
          display: "flex", alignItems: "center", gap: 9,
        }}
      >
        <div
          style={{
            width: 30, height: 30, borderRadius: 8, backgroundColor: iconBg,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <DynamicIcon name={icon} color={iconColour} size={14} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0F2044" }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>{subtitle}</div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
