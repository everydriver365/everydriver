import { Link } from "react-router-dom";
import type { CompletionFlags } from "@/hooks/useSettingsStatus";
import { DynamicIcon } from "./DynamicIcon";

export function AttentionBanner({ completionFlags }: { completionFlags: CompletionFlags | null }) {
  const missing = [
    !completionFlags?.vehicle && "Vehicle & credentials",
    !completionFlags?.hours && "Working hours",
  ].filter(Boolean) as string[];

  if (!missing.length) return null;

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 12,
        backgroundColor: "#FEF3C7", border: "1px solid #FDE68A",
        borderRadius: 10, padding: "13px 16px", marginBottom: 22,
      }}
    >
      <div
        style={{
          width: 32, height: 32, borderRadius: 8, backgroundColor: "#F59E0B",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}
      >
        <DynamicIcon name="triangle-alert" color="#FFF" size={14} />
      </div>
      <p
        style={{
          fontSize: 13, fontWeight: 500, color: "#78350F",
          flex: 1, margin: 0, lineHeight: 1.5,
        }}
      >
        {missing.length} setting{missing.length > 1 ? "s" : ""} need completing before pupils can book:{" "}
        {missing.map((m, i) => (
          <span key={m}>
            <strong>{m}</strong>
            {i < missing.length - 1 ? " and " : ""}
          </span>
        ))}
      </p>
      <Link
        to="/instructor/settings/vehicle"
        style={{
          fontSize: 13, fontWeight: 700, color: "#F59E0B",
          cursor: "pointer", whiteSpace: "nowrap", textDecoration: "none",
        }}
      >
        Fix now →
      </Link>
    </div>
  );
}
