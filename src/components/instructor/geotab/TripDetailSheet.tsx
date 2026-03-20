import { format } from "date-fns";
import { GeotabTrip } from "@/hooks/useGeotabTrips";
import { FuelRecord } from "@/hooks/useGeotabFuelUsage";
import { kmToMiles, kmhToMph } from "@/lib/utils";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose,
} from "@/components/ui/drawer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, FileText, Download, X, Gauge, Clock, Route, Timer, OctagonPause, Activity, Fuel, PoundSterling } from "lucide-react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";

interface TripDetailSheetProps {
  trip: GeotabTrip | null;
  fuelRecord?: FuelRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Behaviour score ──

interface BehaviourResult {
  score: number;
  label: "Green" | "Amber" | "Red" | "N/A";
  speedRatio: number;
  idlePercent: number;
  commentary: string;
}

function calcBehaviour(trip: GeotabTrip): BehaviourResult {
  if (trip.distanceKm <= 0 || trip.durationMinutes <= 0) {
    return { score: 0, label: "N/A", speedRatio: 0, idlePercent: 0, commentary: "Insufficient data for this trip." };
  }

  const speedRatio = trip.maxSpeedKmh > 0 ? trip.avgSpeedKmh / trip.maxSpeedKmh : 1;
  const idlePercent = (trip.idleMinutes / trip.durationMinutes) * 100;

  // Speed consistency: 0-50 pts (ratio 1 = 50, ratio 0.3 = 0)
  const speedScore = Math.min(50, Math.max(0, (speedRatio - 0.3) / 0.7 * 50));

  // Idle efficiency: 0-50 pts (0% idle = 50, 50%+ idle = 0)
  const idleScore = Math.min(50, Math.max(0, (1 - idlePercent / 50) * 50));

  const score = Math.round(speedScore + idleScore);
  const label: BehaviourResult["label"] = score >= 70 ? "Green" : score >= 40 ? "Amber" : "Red";

  const maxRatioText = trip.maxSpeedKmh > 0
    ? `Max speed was ${(trip.maxSpeedKmh / trip.avgSpeedKmh).toFixed(1)}x average`
    : "No max speed data";

  const commentary = label === "Green"
    ? `Good driving consistency. ${maxRatioText}. Idle time was ${idlePercent.toFixed(0)}% of trip.`
    : label === "Amber"
    ? `Moderate driving variance. ${maxRatioText}, suggesting some sharp speed changes. Idle time was ${idlePercent.toFixed(0)}%.`
    : `High driving variance detected. ${maxRatioText}, indicating significant acceleration/deceleration. Idle time was ${idlePercent.toFixed(0)}%.`;

  return { score, label, speedRatio, idlePercent, commentary };
}

const badgeColor: Record<BehaviourResult["label"], string> = {
  Green: "bg-green-500/15 text-green-700 border-green-300",
  Amber: "bg-amber-500/15 text-amber-700 border-amber-300",
  Red: "bg-red-500/15 text-red-700 border-red-300",
  "N/A": "bg-muted text-muted-foreground border-border",
};

// ── Helpers ──

function safeFormat(val: string | null | undefined, fmt: string, fallback = "—"): string {
  if (!val) return fallback;
  const d = new Date(val);
  return isNaN(d.getTime()) ? fallback : format(d, fmt);
}

function fmtDuration(mins: number): string {
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
}

// ── PDF generation ──

function generatePdf(trip: GeotabTrip, behaviour: BehaviourResult) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("EveryDriver", 14, y);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Trip Investigation Report", w - 14, y, { align: "right" });
  y += 12;

  doc.setDrawColor(200);
  doc.line(14, y, w - 14, y);
  y += 10;

  // Trip info
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Trip Summary", 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const rows = [
    ["Date", safeFormat(trip.startTime, "dd MMM yyyy")],
    ["Time", `${safeFormat(trip.startTime, "HH:mm")} – ${safeFormat(trip.endTime, "HH:mm")}`],
    ["Vehicle", trip.deviceName],
    ["Distance", `${kmToMiles(trip.distanceKm).toFixed(1)} mi`],
    ["Duration", fmtDuration(trip.durationMinutes)],
    ["Avg Speed", `${Math.round(kmhToMph(trip.avgSpeedKmh))} mph`],
    ["Max Speed", `${Math.round(kmhToMph(trip.maxSpeedKmh))} mph`],
    ["Idle Time", `${trip.idleMinutes}m`],
    ["Stop Time", `${trip.stopMinutes}m`],
  ];

  rows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, 18, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 70, y);
    y += 6;
  });

  y += 6;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Behaviour Assessment", 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Score: ${behaviour.label === "N/A" ? "N/A" : `${behaviour.score}/100 (${behaviour.label})`}`, 18, y);
  y += 6;

  const splitCommentary = doc.splitTextToSize(behaviour.commentary, w - 36);
  doc.text(splitCommentary, 18, y);
  y += splitCommentary.length * 5 + 6;

  // Scoring rubric
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("Scoring: Speed consistency (avg/max ratio) 50% + Idle efficiency (<50% idle) 50%", 18, y);
  y += 5;
  doc.text("Green: 70-100 | Amber: 40-69 | Red: 0-39", 18, y);
  doc.setTextColor(0);

  const dateStr = safeFormat(trip.startTime, "yyyy-MM-dd");
  doc.save(`EveryDriver-Trip-${dateStr}-${trip.deviceName}.pdf`);
}

// ── CSV export ──

function downloadCsv(trip: GeotabTrip) {
  const headers = ["Date","Start","End","Device","Distance (mi)","Duration","Avg Speed (mph)","Max Speed (mph)","Idle (min)","Stop (min)"];
  const values = [
    safeFormat(trip.startTime, "yyyy-MM-dd"),
    safeFormat(trip.startTime, "HH:mm"),
    safeFormat(trip.endTime, "HH:mm"),
    trip.deviceName,
    kmToMiles(trip.distanceKm).toFixed(1),
    fmtDuration(trip.durationMinutes),
    Math.round(kmhToMph(trip.avgSpeedKmh)).toString(),
    Math.round(kmhToMph(trip.maxSpeedKmh)).toString(),
    trip.idleMinutes.toString(),
    trip.stopMinutes.toString(),
  ];
  const csv = [headers.join(","), values.join(",")].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `trip-${safeFormat(trip.startTime, "yyyy-MM-dd")}.csv`;
  a.click();
}

// ── Component ──

export function TripDetailSheet({ trip, fuelRecord, open, onOpenChange }: TripDetailSheetProps) {
  const navigate = useNavigate();
  if (!trip) return null;

  const behaviour = calcBehaviour(trip);
  const avgMph = Math.round(kmhToMph(trip.avgSpeedKmh));
  const maxMph = Math.round(kmhToMph(trip.maxSpeedKmh));
  const speedBarWidth = maxMph > 0 ? Math.round((avgMph / maxMph) * 100) : 100;

  // Fuel calculations
  const fuelLitres = fuelRecord?.fuel_used_litres ?? null;
  const fuelCost = fuelRecord?.cost_gbp ?? null;
  const fuelMpg = fuelLitres && fuelLitres > 0
    ? Math.round((kmToMiles(fuelRecord?.distance_km ?? trip.distanceKm) / (fuelLitres * 0.219969)) * 10) / 10
    : null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <div className="overflow-y-auto px-4 pb-6">
          <DrawerHeader className="px-0">
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle className="text-base">
                  {safeFormat(trip.startTime, "dd MMM yyyy")} — {trip.deviceName}
                </DrawerTitle>
                <DrawerDescription>
                  {safeFormat(trip.startTime, "HH:mm")} – {safeFormat(trip.endTime, "HH:mm")}
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { icon: Route, label: "Distance", value: `${kmToMiles(trip.distanceKm).toFixed(1)} mi` },
              { icon: Clock, label: "Duration", value: fmtDuration(trip.durationMinutes) },
              { icon: Gauge, label: "Avg Speed", value: `${avgMph} mph` },
              { icon: Gauge, label: "Max Speed", value: `${maxMph} mph` },
              { icon: Timer, label: "Idle", value: `${trip.idleMinutes}m` },
              { icon: OctagonPause, label: "Stops", value: `${trip.stopMinutes}m` },
              ...(fuelMpg != null ? [{ icon: Fuel, label: "MPG", value: `${fuelMpg}` }] : []),
              ...(fuelLitres != null ? [{ icon: Fuel, label: "Fuel", value: `${fuelLitres.toFixed(1)} L` }] : []),
              ...(fuelCost != null ? [{ icon: PoundSterling, label: "Fuel Cost", value: `£${fuelCost.toFixed(2)}` }] : []),
            ].map(({ icon: Icon, label, value }) => (
              <Card key={label}>
                <CardContent className="p-2.5 text-center">
                  <Icon className="h-3.5 w-3.5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm font-bold">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Behaviour Score */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Behaviour Score</span>
              <Badge className={`ml-auto ${badgeColor[behaviour.label]}`}>
                {behaviour.label === "N/A" ? "N/A" : `${behaviour.score} — ${behaviour.label}`}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{behaviour.commentary}</p>
          </div>

          {/* Speed Analysis */}
          <div className="mb-4">
            <p className="text-xs font-semibold mb-1">Speed Analysis</p>
            <div className="h-4 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${speedBarWidth}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>Avg: {avgMph} mph</span>
              <span>Max: {maxMph} mph</span>
            </div>
          </div>

          {/* Fuel Economy */}
          {fuelMpg != null && (
            <div className="mb-4">
              <p className="text-xs font-semibold mb-1">Fuel Economy</p>
              <div className="h-4 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.min(100, (fuelMpg / 60) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                <span>{fuelMpg} mpg</span>
                <span>{fuelRecord?.litres_per_100km?.toFixed(1) ?? "—"} L/100km</span>
              </div>
            </div>
          )}

          {/* Idle Analysis */}
          <div className="mb-5">
            <p className="text-xs font-semibold mb-1">Idle Analysis</p>
            <p className="text-xs text-muted-foreground">
              {trip.durationMinutes > 0
                ? `${((trip.idleMinutes / trip.durationMinutes) * 100).toFixed(0)}% of trip spent idling (${trip.idleMinutes}m of ${fmtDuration(trip.durationMinutes)})`
                : "No duration data"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {trip.startLat && trip.startLng && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/instructor/trip-replay?lat=${trip.startLat}&lng=${trip.startLng}&date=${trip.startTime}`)}
              >
                <Play className="h-3.5 w-3.5 mr-1" /> Replay Trip
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => generatePdf(trip, behaviour)}>
              <FileText className="h-3.5 w-3.5 mr-1" /> PDF Report
            </Button>
            <Button variant="ghost" size="sm" onClick={() => downloadCsv(trip)}>
              <Download className="h-3.5 w-3.5 mr-1" /> CSV
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
