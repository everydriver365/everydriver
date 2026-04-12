import { useState } from "react";
import { Car, Clock, Gauge, Route, Share2, Check } from "lucide-react";
import { ExpandChevron } from "@/components/ui/ExpandChevron";
import { Button } from "@/components/ui/button";
import { InstructorCard } from "@/components/instructor/InstructorCard";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { kmToMiles, kmhToMph } from "@/lib/utils";
import { toast } from "sonner";

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
}

export function StepLessonSummary({
  pupilName,
  durationMinutes,
  lessonDate,
  startTime,
  reportData,
  competencies = [],
  onDone,
}: StepLessonSummaryProps) {
  const [roadsOpen, setRoadsOpen] = useState(false);
  const [shared, setShared] = useState(false);

  const hasTelematics = !!reportData?.stats;

  const uniqueRoads = reportData?.segments
    ? [...new Map(reportData.segments.map(s => [s.name, s])).values()]
        .filter(s => s.name !== "Unknown Road")
    : [];

  const formatTime = (t: string) => t?.slice(0, 5) || "";

  const endTime = (() => {
    if (reportData?.session?.endedAt) {
      return new Date(reportData.session.endedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    }
    const [h, m] = startTime.split(":").map(Number);
    const end = new Date(2000, 0, 1, h, m + durationMinutes);
    return end.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  })();

  const manoeuvreIds = ["reverse_park_road", "reverse_park_bay", "pull_up_right", "emergency_stop"];
  const manoeuvres = competencies.filter(c => manoeuvreIds.includes(c));
  const coreCompetencies = competencies.filter(c => !manoeuvreIds.includes(c));

  const speedingCount = reportData?.stats?.speedingIncidents || 0;
  const brakingCount = reportData?.stats?.harshBrakingCount || 0;
  const accelCount = reportData?.stats?.harshAccelerationCount || 0;
  const totalSafetyEvents = speedingCount + brakingCount + accelCount;

  const buildShareText = () => {
    const dateStr = new Date(lessonDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
    const lines = [
      `🚗 Driving Lesson — ${pupilName}`,
      `📅 ${dateStr} · ${formatTime(startTime)} – ${endTime}`,
      "",
    ];

    if (hasTelematics) {
      const dur = reportData!.stats.duration || durationMinutes;
      lines.push(`⏱ ${dur} min`);
      if (reportData!.stats.distance) lines.push(`📏 ${kmToMiles(reportData!.stats.distance).toFixed(1)} mi`);
      if (reportData!.stats.avgSpeed) lines.push(`🏎 Avg ${Math.round(kmhToMph(reportData!.stats.avgSpeed))} mph`);
      if (reportData!.stats.maxSpeed) lines.push(`🔺 Max ${Math.round(kmhToMph(reportData!.stats.maxSpeed))} mph`);
      lines.push("");
    }

    if (uniqueRoads.length > 0) {
      lines.push(`🛣 Roads: ${uniqueRoads.map(r => r.name).join(", ")}`);
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
      lines.push(`📋 Skills: ${coreCompetencies.map(c => c.replace(/_/g, " ")).join(", ")}`);
    }
    if (manoeuvres.length > 0) {
      lines.push(`🔄 Manoeuvres: ${manoeuvres.map(m => m.replace(/_/g, " ")).join(", ")}`);
    }

    return lines.join("\n");
  };

  const handleShare = async () => {
    const text = buildShareText();

    if (navigator.share) {
      try {
        await navigator.share({ title: `Driving Lesson — ${pupilName}`, text });
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

  return (
    <InstructorCard className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-[hsl(var(--success)/0.15)] flex items-center justify-center">
          <Car className="h-5 w-5 text-[hsl(var(--success))]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Driving Lesson</p>
          <p className="text-sm font-semibold text-foreground truncate">{pupilName}</p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>{formatTime(startTime)} – {endTime}</p>
          <p>{new Date(lessonDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Duration"
          value={hasTelematics && reportData.stats.duration ? `${reportData.stats.duration}` : `${durationMinutes}`}
          unit="min"
          variant="success"
          icon={<Clock className="h-3.5 w-3.5" />}
        />
        <StatCard
          label="Distance"
          value={hasTelematics && reportData.stats.distance ? kmToMiles(reportData.stats.distance).toFixed(1) : "—"}
          unit="mi"
          variant="info"
          icon={<Route className="h-3.5 w-3.5" />}
        />
        <StatCard
          label="Avg Speed"
          value={hasTelematics && reportData.stats.avgSpeed ? `${Math.round(kmhToMph(reportData.stats.avgSpeed))}` : "—"}
          unit="mph"
          variant="warning"
          icon={<Gauge className="h-3.5 w-3.5" />}
        />
        <StatCard
          label="Max Speed"
          value={hasTelematics && reportData.stats.maxSpeed ? `${Math.round(kmhToMph(reportData.stats.maxSpeed))}` : "—"}
          unit="mph"
          variant="danger"
          icon={<Gauge className="h-3.5 w-3.5" />}
        />
      </div>

      {/* Roads Travelled */}
      {uniqueRoads.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Roads Travelled</p>
          <Collapsible open={roadsOpen} onOpenChange={setRoadsOpen}>
            <div className="space-y-1">
              {uniqueRoads.slice(0, roadsOpen ? undefined : 5).map((road, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-2xl bg-muted/30 dark:bg-muted/20">
                  <span className="truncate mr-2 text-foreground">{road.name}</span>
                  <span className={`shrink-0 font-mono ${
                    road.compliance === "over"
                      ? "text-[hsl(var(--destructive))]"
                      : road.compliance === "at"
                        ? "text-[hsl(var(--warning))]"
                        : "text-[hsl(var(--success))]"
                  }`}>
                    {road.speedLimit ? `${Math.round(kmhToMph(road.speedLimit))} mph` : "—"}
                  </span>
                </div>
              ))}
            </div>
            {uniqueRoads.length > 5 && (
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1.5 mx-auto hover:text-foreground transition-colors">
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
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Safety Events</p>
          <div className="grid grid-cols-3 gap-2">
            {speedingCount > 0 && (
              <div className="bg-[hsl(var(--destructive)/0.1)] rounded-2xl p-2 text-center">
                <p className="text-lg font-bold text-[hsl(var(--destructive))]">{speedingCount}</p>
                <p className="text-[10px] text-muted-foreground">Over Speed</p>
              </div>
            )}
            {brakingCount > 0 && (
              <div className="bg-[hsl(var(--warning)/0.1)] rounded-2xl p-2 text-center">
                <p className="text-lg font-bold text-[hsl(var(--warning))]">{brakingCount}</p>
                <p className="text-[10px] text-muted-foreground">Harsh Brake</p>
              </div>
            )}
            {accelCount > 0 && (
              <div className="bg-[hsl(var(--warning)/0.15)] rounded-2xl p-2 text-center">
                <p className="text-lg font-bold text-[hsl(var(--warning))]">{accelCount}</p>
                <p className="text-[10px] text-muted-foreground">Harsh Accel</p>
              </div>
            )}
          </div>
        </div>
      )}

      {hasTelematics && totalSafetyEvents === 0 && (
        <div className="bg-[hsl(var(--success)/0.1)] rounded-2xl p-3 text-center">
          <p className="text-sm text-[hsl(var(--success))] font-medium">✓ No safety events detected</p>
        </div>
      )}

      {/* Core Competencies */}
      {coreCompetencies.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Competencies Covered</p>
          <div className="flex flex-wrap gap-1.5">
            {coreCompetencies.map(c => (
              <span key={c} className="text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground">
                {c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Manoeuvres */}
      {manoeuvres.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Manoeuvres</p>
          <div className="flex flex-wrap gap-1.5">
            {manoeuvres.map(m => (
              <span key={m} className="text-[11px] px-2 py-1 rounded-full bg-secondary/15 text-secondary-foreground dark:bg-secondary/30">
                {m.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleShare}
          variant="outline"
          size="lg"
          className="flex-1"
        >
          {shared ? <Check className="h-4 w-4 mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
          {shared ? "Shared!" : "Share"}
        </Button>
        <Button
          onClick={onDone}
          size="lg"
          className="flex-1"
        >
          Done
        </Button>
      </div>
    </InstructorCard>
  );
}

const VARIANT_STYLES = {
  success: {
    text: "text-[hsl(var(--success))]",
    bg: "bg-[hsl(var(--success)/0.08)]",
  },
  info: {
    text: "text-[hsl(198,93%,59%)]",
    bg: "bg-[hsl(198,93%,59%,0.08)]",
  },
  warning: {
    text: "text-[hsl(var(--warning))]",
    bg: "bg-[hsl(var(--warning)/0.08)]",
  },
  danger: {
    text: "text-[hsl(var(--destructive))]",
    bg: "bg-[hsl(var(--destructive)/0.08)]",
  },
};

function StatCard({
  label,
  value,
  unit,
  variant,
  icon,
}: {
  label: string;
  value: string;
  unit: string;
  variant: keyof typeof VARIANT_STYLES;
  icon: React.ReactNode;
}) {
  const styles = VARIANT_STYLES[variant];
  return (
    <div className={`rounded-2xl p-3 ${styles.bg}`}>
      <div className={`flex items-center gap-1 ${styles.text} mb-1`}>
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${styles.text}`}>{value}</span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}
