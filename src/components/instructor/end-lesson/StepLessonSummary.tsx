import { useState } from "react";
import { Clock, Gauge, Send, Share2, Check, Info, X } from "lucide-react";
import { ExpandChevron } from "@/components/ui/ExpandChevron";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { kmToMiles, kmhToMph } from "@/lib/utils";
import { toast } from "sonner";
import { UserAvatar } from "@/components/instructor/UserAvatar";
import { titleCaseName } from "@/lib/titleCase";
import { detectDataQualityIssues } from "@/lib/detectDataQualityIssues";

interface RouteSegment {
  name: string;
  speedLimit: number | null;
  avgSpeed: number;
  maxSpeed: number;
  compliance: "under" | "at" | "over";
}

interface RouteEvent {
  type: string;
  severity: string;
  location: string;
  speedAtEvent: number | null;
}

interface RouteReportData {
  session: {
    startedAt: string;
    endedAt: string | null;
    startLocation: string;
    endLocation: string;
  };
  stats: {
    distance: number | null;
    avgSpeed: number | null;
    maxSpeed: number | null;
    duration: number | null;
    speedingIncidents: number;
    harshBrakingCount: number;
    harshAccelerationCount: number;
  };
  segments: RouteSegment[];
  events: RouteEvent[];
}

interface StepLessonSummaryProps {
  pupilName: string;
  durationMinutes: number;
  lessonDate: string;
  startTime: string;
  reportData: RouteReportData | null;
  competencies?: string[];
  onDone: () => void;
  onClose?: () => void;
  pupilPhotoUrl?: string | null;
  lessonTypeLabel?: string;
  status?: "completed" | "in-progress" | "cancelled";
}

// Format minutes naturally: 60 → "1h", 75 → "1h 15m", 45 → "45m"
function formatLessonDuration(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const C = {
  text: "#000000",
  muted: "#6E6E73",
  border: "#E5E5EA",
  surface: "#F8FAFB",
  blue: "#2B7BC8",
  green: "#3B8B3B",
  greenBg: "#E8F3E8",
  amber: "#B8801F",
  amberBg: "#FBF1DE",
};

const STATUS_PILL: Record<string, { bg: string; fg: string; label: string }> = {
  completed: { bg: C.greenBg, fg: C.green, label: "Completed" },
  "in-progress": { bg: "#E6F0FA", fg: C.blue, label: "In progress" },
  cancelled: { bg: "#F2F2F4", fg: C.muted, label: "Cancelled" },
};

export function StepLessonSummary({
  pupilName,
  durationMinutes,
  lessonDate,
  startTime,
  reportData,
  competencies = [],
  onDone,
  onClose,
  pupilPhotoUrl = null,
  lessonTypeLabel = "Standard lesson",
  status = "completed",
}: StepLessonSummaryProps) {
  const [roadsOpen, setRoadsOpen] = useState(false);
  const [shared, setShared] = useState(false);

  const hasTelematics = !!reportData?.stats;

  const uniqueRoads = reportData?.segments
    ? [...new Map(reportData.segments.map((s) => [s.name, s])).values()].filter(
        (s) => s.name !== "Unknown Road",
      )
    : [];

  const formatTime = (t: string) => t?.slice(0, 5) || "";

  const endTime = (() => {
    if (reportData?.session?.endedAt) {
      return new Date(reportData.session.endedAt).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    const [h, m] = startTime.split(":").map(Number);
    const end = new Date(2000, 0, 1, h, m + durationMinutes);
    return end.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  })();

  const dateLabel = new Date(lessonDate).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  // Stat values
  const distanceVal =
    hasTelematics && reportData!.stats.distance != null
      ? kmToMiles(reportData!.stats.distance).toFixed(1)
      : null;
  const avgSpeedVal =
    hasTelematics && reportData!.stats.avgSpeed != null
      ? String(Math.round(kmhToMph(reportData!.stats.avgSpeed)))
      : null;
  const maxSpeedVal =
    hasTelematics && reportData!.stats.maxSpeed != null
      ? String(Math.round(kmhToMph(reportData!.stats.maxSpeed)))
      : null;

  const gpsMissingCount = [distanceVal, avgSpeedVal, maxSpeedVal].filter((v) => v === null).length;
  const gpsMissingAny = gpsMissingCount > 0;
  const gpsMissingAll = gpsMissingCount === 3;
  const emptyStateMessage = gpsMissingAll
    ? "No GPS tracking — only duration captured"
    : "GPS lost partway through — distance may be incomplete";

  const manoeuvreIds = ["reverse_park_road", "reverse_park_bay", "pull_up_right", "emergency_stop"];
  const manoeuvres = competencies.filter((c) => manoeuvreIds.includes(c));
  const coreCompetencies = competencies.filter((c) => !manoeuvreIds.includes(c));

  const speedingCount = reportData?.stats?.speedingIncidents || 0;
  const brakingCount = reportData?.stats?.harshBrakingCount || 0;
  const accelCount = reportData?.stats?.harshAccelerationCount || 0;
  const totalSafetyEvents = speedingCount + brakingCount + accelCount;

  // REVIEW pill: re-use existing detection (single-pupil mode)
  const dataIssues = detectDataQualityIssues(
    { id: "_summary", name: pupilName, phone: null },
    [],
  );
  const showReview = dataIssues.includes("invalid-name");
  const displayName = titleCaseName(pupilName) || pupilName;

  const buildShareText = () => {
    const lines = [
      `🚗 Driving Lesson — ${displayName}`,
      `📅 ${dateLabel} · ${formatTime(startTime)} – ${endTime}`,
      "",
    ];

    if (hasTelematics) {
      const dur = reportData!.stats.duration || durationMinutes;
      lines.push(`⏱ ${formatLessonDuration(dur)}`);
      if (reportData!.stats.distance)
        lines.push(`📏 ${kmToMiles(reportData!.stats.distance).toFixed(1)} mi`);
      if (reportData!.stats.avgSpeed)
        lines.push(`🏎 Avg ${Math.round(kmhToMph(reportData!.stats.avgSpeed))} mph`);
      if (reportData!.stats.maxSpeed)
        lines.push(`🔺 Max ${Math.round(kmhToMph(reportData!.stats.maxSpeed))} mph`);
      lines.push("");
    } else {
      lines.push(`⏱ ${formatLessonDuration(durationMinutes)}`);
      lines.push("");
    }

    if (uniqueRoads.length > 0) {
      lines.push(`🛣 Roads: ${uniqueRoads.map((r) => r.name).join(", ")}`);
      lines.push("");
    }

    if (totalSafetyEvents === 0 && hasTelematics) {
      lines.push("✅ No safety events");
    } else if (totalSafetyEvents > 0) {
      if (speedingCount) lines.push(`⚠️ ${speedingCount} over-speed`);
      if (brakingCount) lines.push(`⚠️ ${brakingCount} harsh braking`);
      if (accelCount) lines.push(`⚠️ ${accelCount} harsh accel`);
    }

    if (coreCompetencies.length > 0) {
      lines.push("");
      lines.push(`📋 Skills: ${coreCompetencies.map((c) => c.replace(/_/g, " ")).join(", ")}`);
    }
    if (manoeuvres.length > 0) {
      lines.push(`🔄 Manoeuvres: ${manoeuvres.map((m) => m.replace(/_/g, " ")).join(", ")}`);
    }

    return lines.join("\n");
  };

  const handleShare = async () => {
    const text = buildShareText();

    if (navigator.share) {
      try {
        await navigator.share({ title: `Driving Lesson — ${displayName}`, text });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(text);
      setShared(true);
      toast.success("Summary copied to clipboard");
      setTimeout(() => setShared(false), 2000);
    }
  };

  const handleWhyGps = () => {
    toast.message("GPS tracking", {
      description:
        "Tap Start track at the start of a lesson, grant location permissions, and avoid battery saver mode. Tunnels, indoor parking and dense urban areas can block the signal.",
    });
  };

  const statusPill = STATUS_PILL[status] ?? STATUS_PILL.completed;

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 12,
        overflow: "hidden",
        border: `0.5px solid ${C.border}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          borderBottom: `0.5px solid ${C.border}`,
        }}
      >
        <div style={{ width: 50, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: C.muted,
              letterSpacing: "0.3px",
              textTransform: "uppercase",
              margin: "0 0 1px",
            }}
          >
            {dateLabel}
          </p>
          <p
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: C.text,
              letterSpacing: "-0.2px",
              margin: 0,
            }}
          >
            Lesson summary
          </p>
        </div>
        <div
          style={{
            width: 50,
            flexShrink: 0,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                background: "transparent",
                border: 0,
                padding: 4,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={20} strokeWidth={2} color={C.muted} />
            </button>
          ) : null}
        </div>
      </div>

      {/* Pupil identity bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          borderBottom: `0.5px solid ${C.border}`,
        }}
      >
        <UserAvatar name={displayName} photoUrl={pupilPhotoUrl} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 1,
            }}
          >
            <p
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: C.text,
                letterSpacing: "-0.1px",
                margin: 0,
              }}
            >
              {displayName}
            </p>
            {showReview && (
              <span
                style={{
                  background: C.amberBg,
                  color: C.amber,
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: "0.3px",
                  padding: "2px 5px",
                  borderRadius: 3,
                  textTransform: "uppercase",
                }}
              >
                Review
              </span>
            )}
          </div>
          <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
            {lessonTypeLabel} · {formatTime(startTime)} – {endTime}
          </p>
        </div>
        <span
          style={{
            background: statusPill.bg,
            color: statusPill.fg,
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: "0.3px",
            padding: "3px 7px",
            borderRadius: 999,
            textTransform: "uppercase",
            flexShrink: 0,
          }}
        >
          {statusPill.label}
        </span>
      </div>

      {/* Form content */}
      <div style={{ padding: 16 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: C.muted,
            letterSpacing: "0.3px",
            textTransform: "uppercase",
            margin: "0 0 8px",
          }}
        >
          Lesson stats
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 8,
            marginBottom: gpsMissingAny ? 10 : 14,
          }}
        >
          <StatTile
            icon={<Clock size={12} strokeWidth={2} color={C.muted} />}
            label="Duration"
            value={formatLessonDuration(
              hasTelematics && reportData!.stats.duration
                ? reportData!.stats.duration
                : durationMinutes,
            )}
            unit=""
            empty={false}
          />
          <StatTile
            icon={<Send size={12} strokeWidth={2} color={C.muted} />}
            label="Distance"
            value={distanceVal ?? "—"}
            unit="mi"
            empty={distanceVal == null}
          />
          <StatTile
            icon={<Gauge size={12} strokeWidth={2} color={C.muted} />}
            label="Avg speed"
            value={avgSpeedVal ?? "—"}
            unit="mph"
            empty={avgSpeedVal == null}
          />
          <StatTile
            icon={<Gauge size={12} strokeWidth={2} color={C.muted} />}
            label="Max speed"
            value={maxSpeedVal ?? "—"}
            unit="mph"
            empty={maxSpeedVal == null}
            peak
          />
        </div>

        {/* Empty-state context bar */}
        {gpsMissingAny && (
          <div
            style={{
              background: C.surface,
              border: `0.5px solid ${C.border}`,
              borderRadius: 10,
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <Info size={14} strokeWidth={2} color={C.muted} style={{ flexShrink: 0 }} />
            <p
              style={{
                flex: 1,
                fontSize: 11,
                color: C.muted,
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              {emptyStateMessage}
            </p>
            <button
              type="button"
              onClick={handleWhyGps}
              style={{
                background: "transparent",
                border: 0,
                padding: 0,
                fontSize: 11,
                fontWeight: 500,
                color: C.blue,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              Why?
            </button>
          </div>
        )}

        {/* Roads Travelled */}
        {uniqueRoads.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: C.muted,
                letterSpacing: "0.3px",
                textTransform: "uppercase",
                margin: "0 0 8px",
              }}
            >
              Roads travelled
            </p>
            <Collapsible open={roadsOpen} onOpenChange={setRoadsOpen}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {uniqueRoads.slice(0, roadsOpen ? undefined : 5).map((road, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 12,
                      padding: "6px 10px",
                      borderRadius: 8,
                      background: C.surface,
                      border: `0.5px solid ${C.border}`,
                    }}
                  >
                    <span style={{ color: C.text, marginRight: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {road.name}
                    </span>
                    <span
                      style={{
                        flexShrink: 0,
                        fontFamily: "ui-monospace, monospace",
                        color:
                          road.compliance === "over"
                            ? "#C8434F"
                            : road.compliance === "at"
                              ? C.amber
                              : C.green,
                      }}
                    >
                      {road.speedLimit ? `${Math.round(kmhToMph(road.speedLimit))} mph` : "—"}
                    </span>
                  </div>
                ))}
              </div>
              {uniqueRoads.length > 5 && (
                <CollapsibleTrigger asChild>
                  <button
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      color: C.muted,
                      marginTop: 6,
                      marginInline: "auto",
                      background: "transparent",
                      border: 0,
                      cursor: "pointer",
                    }}
                  >
                    <ExpandChevron isExpanded={roadsOpen} size={12} />
                    {roadsOpen ? "Show less" : `+ ${uniqueRoads.length - 5} more roads`}
                  </button>
                </CollapsibleTrigger>
              )}
              <CollapsibleContent />
            </Collapsible>
          </div>
        )}

        {/* Safety Events */}
        {hasTelematics && totalSafetyEvents > 0 && (
          <div style={{ marginBottom: 14 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: C.muted,
                letterSpacing: "0.3px",
                textTransform: "uppercase",
                margin: "0 0 8px",
              }}
            >
              Safety events
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
              {speedingCount > 0 && (
                <SafetyTile value={speedingCount} label="Over speed" color="#C8434F" />
              )}
              {brakingCount > 0 && (
                <SafetyTile value={brakingCount} label="Harsh brake" color={C.amber} />
              )}
              {accelCount > 0 && (
                <SafetyTile value={accelCount} label="Harsh accel" color={C.amber} />
              )}
            </div>
          </div>
        )}

        {hasTelematics && totalSafetyEvents === 0 && (
          <div
            style={{
              background: C.surface,
              border: `0.5px solid ${C.border}`,
              borderRadius: 10,
              padding: "10px 12px",
              textAlign: "center",
              marginBottom: 14,
            }}
          >
            <p style={{ fontSize: 12, color: C.green, fontWeight: 500, margin: 0 }}>
              ✓ No safety events detected
            </p>
          </div>
        )}

        {/* Core Competencies */}
        {coreCompetencies.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: C.muted,
                letterSpacing: "0.3px",
                textTransform: "uppercase",
                margin: "0 0 8px",
              }}
            >
              Competencies covered
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {coreCompetencies.map((c) => (
                <span
                  key={c}
                  style={{
                    fontSize: 11,
                    padding: "3px 8px",
                    borderRadius: 999,
                    background: C.surface,
                    border: `0.5px solid ${C.border}`,
                    color: C.text,
                  }}
                >
                  {c.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Manoeuvres */}
        {manoeuvres.length > 0 && (
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: C.muted,
                letterSpacing: "0.3px",
                textTransform: "uppercase",
                margin: "0 0 8px",
              }}
            >
              Manoeuvres
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {manoeuvres.map((m) => (
                <span
                  key={m}
                  style={{
                    fontSize: 11,
                    padding: "3px 8px",
                    borderRadius: 999,
                    background: C.surface,
                    border: `0.5px solid ${C.border}`,
                    color: C.text,
                  }}
                >
                  {m.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 16px",
          background: C.surface,
          borderTop: `0.5px solid ${C.border}`,
        }}
      >
        <button
          type="button"
          onClick={handleShare}
          style={{
            flex: 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            background: "transparent",
            border: `0.5px solid ${C.border}`,
            borderRadius: 10,
            padding: "10px 16px",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
            color: C.blue,
          }}
        >
          {shared ? (
            <Check size={14} strokeWidth={2} color={C.blue} />
          ) : (
            <Share2 size={14} strokeWidth={2} color={C.blue} />
          )}
          {shared ? "Shared" : "Share"}
        </button>
        <button
          type="button"
          onClick={onDone}
          style={{
            flex: 1,
            background: C.blue,
            border: 0,
            borderRadius: 10,
            padding: "11px 22px",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
            color: "#FFFFFF",
            textAlign: "center",
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  unit,
  empty,
  peak,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  empty: boolean;
  peak?: boolean;
}) {
  return (
    <div
      style={{
        background: C.surface,
        border: `0.5px solid ${C.border}`,
        borderRadius: 10,
        padding: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 4,
          color: C.muted,
        }}
      >
        <span style={{ position: "relative", display: "inline-flex" }}>
          {icon}
          {peak && (
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                top: -1,
                right: -2,
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: "#C8434F",
              }}
            />
          )}
        </span>
        <span
          style={{
            fontSize: 10,
            color: C.muted,
            letterSpacing: "0.2px",
          }}
        >
          {label}
        </span>
      </div>
      <p
        style={{
          fontSize: 18,
          fontWeight: 500,
          letterSpacing: "-0.3px",
          margin: 0,
          color: empty ? C.muted : C.text,
          display: "flex",
          alignItems: "baseline",
          gap: 4,
        }}
      >
        <span>{value}</span>
        {unit && (
          <span style={{ fontSize: 11, fontWeight: 400, color: C.muted }}>{unit}</span>
        )}
      </p>
    </div>
  );
}

function SafetyTile({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div
      style={{
        background: C.surface,
        border: `0.5px solid ${C.border}`,
        borderRadius: 10,
        padding: "10px 8px",
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: 18, fontWeight: 500, color, margin: 0, letterSpacing: "-0.3px" }}>
        {value}
      </p>
      <p style={{ fontSize: 10, color: C.muted, margin: "2px 0 0" }}>{label}</p>
    </div>
  );
}
