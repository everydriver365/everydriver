import { AlertTriangle } from "lucide-react";
import { usePupilRetentionAlerts } from "@/hooks/usePupilRetentionAlerts";

interface Props { instructorId: string; }

function initials(name: string) {
  return name.split(" ").map(p => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export function RetentionAlertsPanel({ instructorId }: Props) {
  const { alerts, loading } = usePupilRetentionAlerts(instructorId);
  if (loading || alerts.length === 0) return null;

  return (
    <div className="d2-card" style={{ padding: 16 }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
        <AlertTriangle size={14} style={{ color: "var(--d2-amber-fg)" }} />
        <h2 style={{ fontSize: 14, fontWeight: 500, color: "var(--d2-text-1)", margin: 0 }}>
          Retention alerts
        </h2>
        <span
          style={{
            background: "var(--d2-amber-bg)",
            color: "var(--d2-amber-fg)",
            fontSize: 10, fontWeight: 600,
            padding: "2px 8px", borderRadius: 6,
          }}
        >
          {alerts.length} at risk
        </span>
      </div>

      <div
        className="flex gap-2 overflow-x-auto"
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="grid grid-cols-3 gap-2 w-full">
          {alerts.slice(0, 3).map((a) => (
            <div
              key={a.pupilId}
              className="flex items-center gap-2"
              style={{
                background: "#F1F5F9",
                borderRadius: 8,
                padding: 8,
                minWidth: 0,
              }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: "var(--d2-indigo-bg)",
                  color: "var(--d2-indigo)",
                  fontSize: 10, fontWeight: 600,
                }}
              >
                {initials(a.pupilName)}
              </div>
              <div className="min-w-0">
                <p style={{
                  fontSize: 11, fontWeight: 500, color: "var(--d2-text-1)",
                  margin: 0, lineHeight: 1.2,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {a.pupilName}
                </p>
                <p style={{ fontSize: 10, color: "var(--d2-text-3)", margin: 0 }}>
                  {a.daysSinceLastLesson} days
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
