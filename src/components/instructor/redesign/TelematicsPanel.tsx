import { Activity } from "lucide-react";

interface TelematicsPanelProps {
  reg?: string | null;
  vehicle?: string | null;
  isOnline?: boolean;
  onClick?: () => void;
}

export function TelematicsPanel({ reg, vehicle, isOnline = true, onClick }: TelematicsPanelProps) {
  const subtitle = [reg, vehicle].filter(Boolean).join(" · ") || "Vehicle not configured";
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 text-left"
      style={{
        background: "#0a0e27",
        borderRadius: 12,
        padding: 12,
        color: "#fff",
      }}
    >
      <div
        className="flex items-center justify-center shrink-0"
        style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(26,111,212,0.25)" }}
      >
        <Activity className="h-[18px] w-[18px]" color="#5DA6E8" strokeWidth={2.2} />
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 13, fontWeight: 500 }}>Telematics</div>
        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }} className="truncate">
          {subtitle}
        </div>
      </div>
      <span
        className="flex items-center gap-1.5 shrink-0"
        style={{
          background: "rgba(93,202,165,0.2)",
          padding: "4px 10px",
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 600,
          color: "#5DCAA5",
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#5DCAA5" }} />
        {isOnline ? "Online" : "Offline"}
      </span>
    </button>
  );
}
