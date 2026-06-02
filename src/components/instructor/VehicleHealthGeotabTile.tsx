import { useNavigate } from "react-router-dom";
import { ChevronRight, ShieldCheck, AlertTriangle, ShieldAlert, Video } from "lucide-react";
import { TileCard } from "@/components/instructor/ui";
import { useGeotabHealth } from "@/hooks/useGeotabHealth";

interface Props {
  instructorId: string;
}

const FONT = '"Poppins", system-ui, -apple-system, "Segoe UI", sans-serif';
const INNER: React.CSSProperties = { padding: 14, fontFamily: FONT };

const eyebrow: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.6,
  color: "#8a93a4",
  textTransform: "uppercase",
};

function pickAccent(score: number, hasImpact: boolean) {
  if (hasImpact || score < 60) return { bg: "#FBEAEC", fg: "#C8434F", Icon: ShieldAlert };
  if (score < 85) return { bg: "#FBF1DE", fg: "#B8801F", Icon: AlertTriangle };
  return { bg: "#E8F3E8", fg: "#3B8B3B", Icon: ShieldCheck };
}

/**
 * Mobile-home pinned tile — only renders when the instructor has an active
 * Geotab device. Hidden entirely otherwise (no empty state).
 */
export function VehicleHealthGeotabTile({ instructorId }: Props) {
  const navigate = useNavigate();
  const { data, isLoading } = useGeotabHealth(instructorId);

  if (isLoading) return null;
  if (!data?.hasGeotab) return null;

  const score = data.score ?? 100;
  const hasImpact = data.unacknowledgedImpacts24h > 0;
  const accent = pickAccent(score, hasImpact);
  const Icon = accent.Icon;

  const subtitle = (() => {
    if (hasImpact) return `Impact alert · ${data.activeFaults} active fault${data.activeFaults === 1 ? "" : "s"}`;
    if (data.activeFaults > 0) return `${data.activeFaults} active fault${data.activeFaults === 1 ? "" : "s"}`;
    if (data.harshEvents24h > 0) return `${data.harshEvents24h} harsh event${data.harshEvents24h === 1 ? "" : "s"} · 24h`;
    return "All systems normal";
  })();

  return (
    <TileCard
      onClick={() => navigate("/instructor/vehicle-health?tab=geotab")}
      ariaLabel="Vehicle health (Geotab)"
    >
      <div style={INNER}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span style={eyebrow}>Vehicle health</span>
            {data.deviceName && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#6B7280",
                  marginTop: 2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 220,
                }}
                title={data.deviceName}
              >
                Geotab · {data.deviceName}
              </span>
            )}
          </div>
          <ChevronRight size={16} color="#8a93a4" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: accent.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <Icon size={22} color={accent.fg} />
            {hasImpact && (
              <span
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: "#C8434F",
                  border: "2px solid #fff",
                }}
              />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: "#1F2937", lineHeight: 1 }}>
                {score}
              </span>
              <span style={{ fontSize: 11, color: "#8a93a4", fontWeight: 600 }}>/100</span>
            </div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
              {subtitle}
            </div>
          </div>
        </div>
        {data.recentClips7d > 0 && (
          <div style={{ marginTop: 10, display: "flex" }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate("/instructor/vehicle-health?tab=geotab&sub=video");
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                borderRadius: 999,
                background: "#EDF2FE",
                color: "#3D55A1",
                fontSize: 11,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                fontFamily: FONT,
              }}
              aria-label="Open dashcam video"
            >
              <Video size={12} />
              Video · {data.recentClips7d} clip{data.recentClips7d === 1 ? "" : "s"}
            </button>
          </div>
        )}
      </div>
    </TileCard>
  );
}

export default VehicleHealthGeotabTile;
