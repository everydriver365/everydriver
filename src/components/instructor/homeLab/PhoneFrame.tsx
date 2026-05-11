import { ReactNode } from "react";

export function PhoneFrame({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">{label}</div>
      <div
        style={{
          width: 390,
          height: 760,
          borderRadius: 44,
          background: "#0B0B0F",
          padding: 10,
          boxShadow: "0 30px 60px -20px rgba(15,23,42,0.35), 0 8px 20px -8px rgba(15,23,42,0.2)",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 36,
            background: "#F4F7F6",
            overflow: "hidden",
            position: "relative",
          }}
          className="instructor-portal"
        >
          {/* status bar */}
          <div
            style={{
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 22px",
              fontSize: 13,
              fontWeight: 600,
              color: "#111827",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, sans-serif",
            }}
          >
            <span>9:41</span>
            <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
              <span style={{ fontSize: 11 }}>●●●●</span>
              <span style={{ fontSize: 11 }}>5G</span>
              <span style={{ fontSize: 11 }}>100%</span>
            </span>
          </div>
          <div style={{ height: "calc(100% - 36px)", overflowY: "auto" }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
