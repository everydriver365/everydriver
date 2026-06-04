import { ReactNode, useEffect } from "react";

export function ActionDrawer({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)",
        zIndex: 60, display: "flex", justifyContent: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 480, maxWidth: "92vw", height: "100%", background: "#fff",
          borderLeft: "1px solid #E5E7EB",
          display: "flex", flexDirection: "column",
          boxShadow: "-12px 0 32px rgba(15,23,42,0.18)",
        }}
      >
        <div
          style={{
            padding: "14px 18px", borderBottom: "1px solid #F3F4F6",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{title}</div>
            {subtitle && <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "1px solid #E5E7EB", borderRadius: 6,
              padding: "4px 8px", fontSize: 11, cursor: "pointer", color: "#374151",
            }}
          >
            ✕ Close
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>{children}</div>
      </div>
    </div>
  );
}

export function DrawerEmpty({ children }: { children: ReactNode }) {
  return (
    <div style={{ padding: 24, textAlign: "center", color: "#9CA3AF", fontSize: 12 }}>
      {children}
    </div>
  );
}

export function DrawerLoading() {
  return <DrawerEmpty>Loading…</DrawerEmpty>;
}

export function DrawerError({ message }: { message: string }) {
  return (
    <div style={{ padding: 16, color: "#DC2626", fontSize: 12 }}>
      {message}
    </div>
  );
}

export function DrawerRow({
  left, right, sub,
}: { left: ReactNode; right?: ReactNode; sub?: ReactNode }) {
  return (
    <div
      style={{
        padding: "10px 4px", borderBottom: "1px solid #F3F4F6",
        display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start",
      }}
    >
      <div style={{ fontSize: 12, color: "#0F172A" }}>
        {left}
        {sub && <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{sub}</div>}
      </div>
      {right && <div style={{ fontSize: 12, color: "#374151", whiteSpace: "nowrap" }}>{right}</div>}
    </div>
  );
}
