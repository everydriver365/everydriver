import type { ReactNode } from "react";

export function SettingRow({
  children, full = false, last = false,
}: { children: ReactNode; full?: boolean; last?: boolean }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: full ? "1fr" : "1fr 1fr",
        borderBottom: last ? "none" : "1px solid #F2F4F8",
      }}
    >
      {children}
    </div>
  );
}

export function SettingCell({
  label, sub, last = false, top = false, children,
}: {
  label: string;
  sub?: string;
  last?: boolean;
  top?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        padding: "14px 20px",
        display: "flex",
        alignItems: top ? "flex-start" : "center",
        justifyContent: "space-between",
        gap: 12,
        borderRight: last ? "none" : "1px solid #F2F4F8",
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#0F2044", marginBottom: 2 }}>
          {label}
        </div>
        {sub && (
          <div style={{ fontSize: 11, fontWeight: 300, color: "#9CA3AF" }}>{sub}</div>
        )}
      </div>
      {children !== undefined && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {children}
        </div>
      )}
    </div>
  );
}
