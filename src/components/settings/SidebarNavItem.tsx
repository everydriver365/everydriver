import type { SidebarItemConfig } from "@/config/settingsSections";
import type { CompletionFlags } from "@/hooks/useSettingsStatus";
import { DynamicIcon } from "./DynamicIcon";

interface Props {
  item: SidebarItemConfig;
  isActive: boolean;
  onClick: (id: string) => void;
  completionFlags: CompletionFlags | null;
  waitingCount: number;
}

export function SidebarNavItem({
  item, isActive, onClick, completionFlags, waitingCount,
}: Props) {
  const needsVehicle = item.flag === "vehicle" && completionFlags && !completionFlags.vehicle;
  const needsHours = item.flag === "hours" && completionFlags && !completionFlags.hours;
  const count = item.countKey === "waitingCount" ? waitingCount : null;

  return (
    <div
      onClick={() => onClick(item.id)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "7px 16px", cursor: "pointer",
        backgroundColor: isActive ? "#E6F1FB" : "transparent",
        position: "relative", transition: "background 0.1s",
      }}
      onMouseEnter={e => {
        if (!isActive) (e.currentTarget as HTMLDivElement).style.backgroundColor = "#F2F4F8";
      }}
      onMouseLeave={e => {
        if (!isActive) (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
      }}
    >
      {isActive && (
        <div
          style={{
            position: "absolute", left: 0, top: 4, bottom: 4,
            width: 3, backgroundColor: "#CC2229",
            borderRadius: "0 2px 2px 0",
          }}
        />
      )}
      <div
        style={{
          width: 28, height: 28, borderRadius: 7, backgroundColor: item.iconBg,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}
      >
        <DynamicIcon name={item.icon} color={item.iconColour} size={14} />
      </div>
      <span
        style={{
          fontSize: 13,
          fontWeight: isActive ? 600 : 400,
          color: isActive ? "#1A52A0" : "#6B7280",
          flex: 1,
        }}
      >
        {item.label}
      </span>
      {needsVehicle && (
        <span style={{ fontSize: 10, fontWeight: 600, backgroundColor: "#FBEAEA", color: "#CC2229", borderRadius: 20, padding: "1px 7px" }}>!</span>
      )}
      {needsHours && (
        <span style={{ fontSize: 10, fontWeight: 600, backgroundColor: "#FEF3C7", color: "#92400E", borderRadius: 20, padding: "1px 7px" }}>!</span>
      )}
      {count != null && count > 0 && (
        <span style={{ fontSize: 10, fontWeight: 600, backgroundColor: "#E6F1FB", color: "#1A52A0", borderRadius: 20, padding: "1px 7px" }}>{count}</span>
      )}
    </div>
  );
}
