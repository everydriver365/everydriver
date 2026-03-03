import { useState } from "react";
import { Car, Clock, Gauge, Route, AlertTriangle, ChevronDown, ChevronUp, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { kmToMiles, kmhToMph } from "@/lib/utils";

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

  const hasTelematics = !!reportData?.stats;

  // Derive unique roads from segments
  const uniqueRoads = reportData?.segments
    ? [...new Map(reportData.segments.map(s => [s.name, s])).values()]
        .filter(s => s.name !== "Unknown Road")
    : [];

  // Format time from HH:MM:SS to HH:MM
  const formatTime = (t: string) => t?.slice(0, 5) || "";

  // Calculate end time
  const endTime = (() => {
    if (reportData?.session?.endedAt) {
      return new Date(reportData.session.endedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    }
    const [h, m] = startTime.split(":").map(Number);
    const end = new Date(2000, 0, 1, h, m + durationMinutes);
    return end.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  })();

  // Manoeuvre competencies
  const manoeuvreIds = ["reverse_park_road", "reverse_park_bay", "pull_up_right", "emergency_stop"];
  const manoeuvres = competencies.filter(c => manoeuvreIds.includes(c));
  const coreCompetencies = competencies.filter(c => !manoeuvreIds.includes(c));

  // Safety events
  const speedingCount = reportData?.stats?.speedingIncidents || 0;
  const brakingCount = reportData?.stats?.harshBrakingCount || 0;
  const accelCount = reportData?.stats?.harshAccelerationCount || 0;
  const totalSafetyEvents = speedingCount + brakingCount + accelCount;

  return (
    <div className="rounded-2xl bg-[#1C1C1E] text-white p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
          <Car className="h-5 w-5 text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-white/60 uppercase tracking-wide">Driving Lesson</p>
          <p className="text-sm font-semibold truncate">{pupilName}</p>
        </div>
        <div className="text-right text-xs text-white/50">
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
          color="text-green-400"
          icon={<Clock className="h-3.5 w-3.5" />}
        />
        <StatCard
          label="Distance"
          value={hasTelematics && reportData.stats.distance ? kmToMiles(reportData.stats.distance).toFixed(1) : "—"}
          unit="mi"
          color="text-cyan-400"
          icon={<Route className="h-3.5 w-3.5" />}
        />
        <StatCard
          label="Avg Speed"
          value={hasTelematics && reportData.stats.avgSpeed ? `${Math.round(kmhToMph(reportData.stats.avgSpeed))}` : "—"}
          unit="mph"
          color="text-yellow-400"
          icon={<Gauge className="h-3.5 w-3.5" />}
        />
        <StatCard
          label="Max Speed"
          value={hasTelematics && reportData.stats.maxSpeed ? `${Math.round(kmhToMph(reportData.stats.maxSpeed))}` : "—"}
          unit="mph"
          color="text-rose-400"
          icon={<Gauge className="h-3.5 w-3.5" />}
        />
      </div>

      {/* Roads Travelled */}
      {uniqueRoads.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-white/40 mb-2">Roads Travelled</p>
          <Collapsible open={roadsOpen} onOpenChange={setRoadsOpen}>
            <div className="space-y-1">
              {uniqueRoads.slice(0, roadsOpen ? undefined : 5).map((road, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-white/5">
                  <span className="truncate mr-2">{road.name}</span>
                  <span className={`shrink-0 font-mono ${
                    road.compliance === "over" ? "text-rose-400" : road.compliance === "at" ? "text-yellow-400" : "text-green-400"
                  }`}>
                    {road.speedLimit ? `${Math.round(kmhToMph(road.speedLimit))} mph` : "—"}
                  </span>
                </div>
              ))}
            </div>
            {uniqueRoads.length > 5 && (
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-1 text-[11px] text-white/50 mt-1.5 mx-auto">
                  {roadsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
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
          <p className="text-[11px] uppercase tracking-wider text-white/40 mb-2">Safety Events</p>
          <div className="grid grid-cols-3 gap-2">
            {speedingCount > 0 && (
              <div className="bg-rose-500/10 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-rose-400">{speedingCount}</p>
                <p className="text-[10px] text-white/50">Over Speed</p>
              </div>
            )}
            {brakingCount > 0 && (
              <div className="bg-orange-500/10 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-orange-400">{brakingCount}</p>
                <p className="text-[10px] text-white/50">Harsh Brake</p>
              </div>
            )}
            {accelCount > 0 && (
              <div className="bg-yellow-500/10 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-yellow-400">{accelCount}</p>
                <p className="text-[10px] text-white/50">Harsh Accel</p>
              </div>
            )}
          </div>
        </div>
      )}

      {hasTelematics && totalSafetyEvents === 0 && (
        <div className="bg-green-500/10 rounded-lg p-3 text-center">
          <p className="text-sm text-green-400 font-medium">✓ No safety events detected</p>
        </div>
      )}

      {/* Core Competencies */}
      {coreCompetencies.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-white/40 mb-2">Competencies Covered</p>
          <div className="flex flex-wrap gap-1.5">
            {coreCompetencies.map(c => (
              <span key={c} className="text-[11px] px-2 py-1 rounded-full bg-blue-500/15 text-blue-300">
                {c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Manoeuvres */}
      {manoeuvres.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-white/40 mb-2">Manoeuvres</p>
          <div className="flex flex-wrap gap-1.5">
            {manoeuvres.map(m => (
              <span key={m} className="text-[11px] px-2 py-1 rounded-full bg-purple-500/15 text-purple-300">
                {m.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Done button */}
      <Button
        onClick={onDone}
        className="w-full bg-white/10 hover:bg-white/20 text-white border-0"
        size="lg"
      >
        Done
      </Button>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  color,
  icon,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white/5 rounded-xl p-3">
      <div className={`flex items-center gap-1 ${color} mb-1`}>
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
        <span className="text-xs text-white/40">{unit}</span>
      </div>
    </div>
  );
}
