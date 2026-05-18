import { ReactNode } from "react";
import { t } from "./tokens";

export function ProfileCard({
  icon, iconBg = t.blueLight, iconColor = t.blue, title, subtitle, children,
}: {
  icon: ReactNode;
  iconBg?: string;
  iconColor?: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div style={{
      backgroundColor: t.white,
      borderRadius: 14,
      border: `1px solid ${t.border}`,
      overflow: "hidden",
      boxShadow: "0 1px 4px rgba(15,32,68,0.04)",
      marginBottom: 16,
    }}>
      <div style={{
        padding: "16px 20px 14px",
        borderBottom: `1px solid ${t.divider}`,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7, backgroundColor: iconBg,
          display: "flex", alignItems: "center", justifyContent: "center", color: iconColor,
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: t.navy }}>{title}</div>
          <div style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>{subtitle}</div>
        </div>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}
