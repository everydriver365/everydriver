import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Car, Activity, ParkingCircle, Gauge, TrendingUp, Clock, Route, Zap,
  ShieldAlert, Wrench, Fuel, ChevronRight, Play, Thermometer, Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useDriverTimesheets } from "@/hooks/useDriverTimesheets";
import { TrackedLessons } from "./TrackedLessons";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";

interface FleetDashboardProps {
  instructorId: string;
  onTabChange?: (tab: string) => void;
}

interface DeviceStatus {
  id: string;
  device_name: string | null;
  last_speed_kmh: number | null;
  last_ignition_status: boolean | null;
  last_seen_at: string | null;
  last_road_name: string | null;
  last_latitude: number | null;
  last_longitude: number | null;
}

type VehicleState = "moving" | "idle" | "parked";

function getVehicleState(device: DeviceStatus): VehicleState {
  if (!device.last_seen_at) return "parked";
  const lastSeen = new Date(device.last_seen_at).getTime();
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  if (lastSeen < fiveMinAgo) return "parked";
  if (device.last_speed_kmh && device.last_speed_kmh > 2) return "moving";
  if (device.last_ignition_status) return "idle";
  return "parked";
}

const kmToMiles = (km: number) => +(km * 0.621371).toFixed(1);

function getScoreColor(score: number | null): string {
  if (score === null) return "hsl(var(--muted-foreground))";
  if (score >= 80) return "hsl(var(--success))";
  if (score >= 60) return "hsl(var(--warning))";
  return "hsl(var(--destructive))";
}

export function FleetDashboard({ instructorId, onTabChange }: FleetDashboardProps) {
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");
  const [mileageLogs, setMileageLogs] = useState<{ log_date: string; distance_km: number }[]>([]);
  const [mileageLoading, setMileageLoading] = useState(true);

  const rangeDays = period === "day" ? 1 : period === "week" ? 7 : 30;
  const fromDate = useMemo(() => subDays(new Date(), rangeDays), [rangeDays]);
  const toDate = useMemo(() => new Date(), [rangeDays]);
  const { timesheets, loading: tsLoading } = useDriverTimesheets(instructorId, fromDate, toDate);

  const driverScore: number | null = null;

  // Live speeding event count
  const { data: speedingCount } = useQuery({
    queryKey: ["speeding-count", instructorId, fromDate.toISOString()],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("telematics_alerts")
        .select("*", { count: "exact", head: true })
        .eq("alert_type", "speeding")
        .gte("created_at", fromDate.toISOString())
        .in("telematics_id", (await supabase
          .from("lesson_telematics")
          .select("id")
          .eq("instructor_id", instructorId)
        ).data?.map(t => t.id) || []);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    async function fetchMileage() {
      setMileageLoading(true);
      const { data } = await supabase
        .from("mileage_logs")
        .select("log_date, distance_km")
        .eq("instructor_id", instructorId)
        .gte("log_date", fromDate.toISOString().split("T")[0])
        .lte("log_date", toDate.toISOString().split("T")[0])
        .order("log_date", { ascending: true });
      setMileageLogs(data || []);
      setMileageLoading(false);
    }
    fetchMileage();
  }, [instructorId, rangeDays]);

  useEffect(() => {
    async function fetchDevices() {
      setLoading(true);
      const { data } = await supabase
        .from("gps_devices")
        .select("id, device_name, last_speed_kmh, last_ignition_status, last_seen_at, last_road_name, last_latitude, last_longitude")
        .eq("instructor_id", instructorId)
        .eq("is_active", true)
        .not("last_seen_at", "is", null);
      setDevices((data as DeviceStatus[]) || []);
      setLoading(false);
    }
    fetchDevices();
  }, [instructorId]);

  const statusCounts = { moving: 0, idle: 0, parked: 0 };
  devices.forEach(d => { statusCounts[getVehicleState(d)]++; });

  const dailyMileage = mileageLogs
    .reduce((acc, log) => {
      const date = log.log_date;
      const existing = acc.find(a => a.date === date);
      const miles = kmToMiles(log.distance_km || 0);
      if (existing) existing.miles += miles;
      else acc.push({ date, miles, label: format(new Date(date), "EEE") });
      return acc;
    }, [] as { date: string; miles: number; label: string }[])
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalMiles = dailyMileage.reduce((s, d) => s + d.miles, 0);
  const totalDrivingMins = timesheets.reduce((s, t) => s + (t.total_driving_minutes || 0), 0);
  const totalTrips = timesheets.reduce((s, t) => s + (t.trip_count || 0), 0);
  const avgDailyMiles = dailyMileage.length > 0 ? +(totalMiles / dailyMileage.length).toFixed(1) : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  // Empty state for instructors with no devices
  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Radio className="h-12 w-12 text-muted-foreground/30 mb-3" />
        <p className="text-foreground font-semibold">No GPS tracker connected</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Connect a GPS device in Settings → GPS Tracking to see live vehicle data, mileage, and driver scores.
        </p>
      </div>
    );
  }

  const primaryDevice = devices[0];
  const primaryState = primaryDevice ? getVehicleState(primaryDevice) : "parked";

  const scoreColor = getScoreColor(driverScore);
  const scoreValue = driverScore ?? 0;
  const scoreDisplay = driverScore !== null ? `${driverScore}` : "—";

  const journeyItems = [
    { icon: Route, label: "Total Miles", value: `${totalMiles.toFixed(0)} mi`, sub: `${avgDailyMiles} mi/day avg`, positive: true, tab: null },
    { icon: Clock, label: "Drive Time", value: `${(totalDrivingMins / 60).toFixed(1)} hrs`, sub: `${totalTrips} trips`, positive: true, tab: null },
    { icon: Play, label: "Fleet Vehicles", value: `${devices.length}`, sub: `${statusCounts.moving} active now`, positive: true, tab: null },
  ];

  const speedingValue = speedingCount != null ? `${speedingCount}` : "—";
  const speedingPositive = speedingCount != null ? speedingCount === 0 : true;

  const safetyItems = [
    { icon: ShieldAlert, label: "Driver Score", value: driverScore !== null ? `${driverScore}/100` : "—", sub: driverScore !== null ? (driverScore >= 80 ? "Good" : driverScore >= 60 ? "Needs attention" : "Poor") : "No data", positive: driverScore !== null ? driverScore >= 60 : true, tab: "behaviour" },
    { icon: Gauge, label: "Speeding Events", value: speedingValue, sub: speedingCount === 0 ? "No events" : "View details", positive: speedingPositive, tab: "speeding" },
    { icon: Zap, label: "Utilisation", value: `${devices.length > 0 ? Math.round(((statusCounts.moving + statusCounts.idle) / devices.length) * 100) : 0}%`, sub: "vehicles in use", positive: true, tab: null },
  ];

  // Last seen timestamp for primary device
  const lastSeenText = primaryDevice?.last_seen_at
    ? formatDistanceToNow(new Date(primaryDevice.last_seen_at), { addSuffix: true })
    : null;

  return (
    <div className="space-y-5">
      {/* ── Period selector ── */}
      <div className="bg-muted/40 rounded-2xl p-1 flex max-w-xs">
        {(["day", "week", "month"] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              "flex-1 py-1.5 text-xs font-semibold rounded-2xl transition-all capitalize",
              period === p
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            {p === "day" ? "Today" : p === "week" ? "Week" : "Month"}
          </button>
        ))}
      </div>

      {/* ── Hero score ring + summary ── */}
      <div className="flex items-center gap-5">
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke={scoreColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${scoreValue * 2.64} ${264}`}
              style={{
                transition: "stroke-dasharray 1s ease-out, stroke 0.5s ease",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold text-foreground">{scoreDisplay}</p>
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Score</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success" />
            <span className="text-xs text-foreground">{totalMiles.toFixed(0)} miles this {period}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-chart-1" />
            <span className="text-xs text-foreground">{totalTrips} trips completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-warning" />
            <span className="text-xs text-foreground">{statusCounts.moving} vehicle{statusCounts.moving !== 1 ? "s" : ""} active</span>
          </div>
        </div>
      </div>

      {/* ── Live vehicle strip ── */}
      {primaryDevice && (
        <div className="bg-card rounded-2xl border border-border p-3 flex items-center gap-3 shadow-sm">
          <div className={cn(
            "h-10 w-10 rounded-2xl flex items-center justify-center",
            primaryState === "moving" ? "bg-success/10" : primaryState === "idle" ? "bg-warning/10" : "bg-muted/50"
          )}>
            <Car className={cn(
              "h-5 w-5",
              primaryState === "moving" ? "text-success" : primaryState === "idle" ? "text-warning" : "text-muted-foreground"
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{primaryDevice.device_name || "Vehicle"}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {primaryState === "moving" && primaryDevice.last_speed_kmh
                ? `${Math.round(primaryDevice.last_speed_kmh * 0.621371)} mph`
                : primaryState === "idle" ? "Engine on" : "Parked"
              }
              {primaryDevice.last_road_name ? ` · ${primaryDevice.last_road_name}` : ""}
              {lastSeenText ? ` · ${lastSeenText}` : ""}
            </p>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              "border-0 text-[10px] capitalize",
              primaryState === "moving" ? "bg-success/10 text-success" :
              primaryState === "idle" ? "bg-warning/10 text-warning" :
              "bg-muted text-muted-foreground"
            )}
          >
            {primaryState}
          </Badge>
        </div>
      )}

      {/* ── Category: Journey ── */}
      <CategorySection title="Journey" items={journeyItems} />

      {/* ── Category: Safety & Performance ── */}
      <CategorySection title="Safety & Performance" items={safetyItems} onItemClick={(tab) => {
        if (tab && onTabChange) onTabChange(tab);
      }} />

      {/* ── Category: Vehicles ── */}
      {devices.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em] mb-2 px-0.5">
            Vehicles
          </p>
          <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden shadow-sm">
            {devices.map(device => {
              const state = getVehicleState(device);
              return (
                <div key={device.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={cn(
                    "h-9 w-9 rounded-2xl flex items-center justify-center",
                    state === "moving" ? "bg-success/10" : state === "idle" ? "bg-warning/10" : "bg-muted/50"
                  )}>
                    {state === "moving" ? (
                      <Car className="h-4 w-4 text-success" />
                    ) : state === "idle" ? (
                      <Activity className="h-4 w-4 text-warning" />
                    ) : (
                      <ParkingCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{device.device_name || "Vehicle"}</p>
                    {device.last_road_name && (
                      <p className="text-[10px] text-muted-foreground truncate">{device.last_road_name}</p>
                    )}
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "border-0 text-[10px]",
                      state === "moving" ? "bg-success/10 text-success" :
                      state === "idle" ? "bg-warning/10 text-warning" :
                      "bg-muted text-muted-foreground"
                    )}
                  >
                    {state === "moving" ? `${Math.round((device.last_speed_kmh || 0) * 0.621371)} mph` : state}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Activity: Mileage Chart ── */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em] mb-2 px-0.5">
          Activity
        </p>
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-3">
            {period === "day" ? "Today's" : period === "week" ? "Weekly" : "Monthly"} Mileage
          </p>
          {tsLoading || mileageLoading ? (
            <Skeleton className="h-[120px] rounded-2xl" />
          ) : dailyMileage.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No trip data for this period</p>
          ) : (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={dailyMileage}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: number) => [`${v.toFixed(1)} mi`, "Miles"]}
                  labelFormatter={(_, payload) => {
                    if (payload?.[0]?.payload?.date) {
                      return format(new Date(payload[0].payload.date), "EEE dd MMM");
                    }
                    return "";
                  }}
                />
                <Bar dataKey="miles" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Recent Lessons ── */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em] mb-2 px-0.5">
          Recent Lessons
        </p>
        <TrackedLessons instructorId={instructorId} compact limit={5} />
      </div>
    </div>
  );
}

/* ── Reusable category section ── */
function CategorySection({ title, items, onItemClick }: {
  title: string;
  items: Array<{ icon: React.ElementType; label: string; value: string; sub: string; positive: boolean; tab?: string | null }>;
  onItemClick?: (tab: string | null) => void;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em] mb-2 px-0.5">
        {title}
      </p>
      <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden shadow-sm">
        {items.map(item => (
          <div
            key={item.label}
            className={cn(
              "flex items-center gap-3 px-4 py-3",
              item.tab && onItemClick ? "cursor-pointer active:bg-muted/30 transition-colors" : ""
            )}
            onClick={() => item.tab && onItemClick?.(item.tab)}
          >
            <div className={cn(
              "h-9 w-9 rounded-2xl flex items-center justify-center",
              item.positive ? "bg-success/10" : "bg-destructive/10"
            )}>
              <item.icon className={cn("h-4 w-4", item.positive ? "text-success" : "text-destructive")} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground">{item.label}</p>
              {item.sub && <p className="text-[10px] text-muted-foreground">{item.sub}</p>}
            </div>
            <span className="text-sm font-semibold text-foreground">{item.value}</span>
            <ChevronRight className={cn("h-4 w-4", item.tab ? "text-muted-foreground" : "text-muted-foreground/40")} />
          </div>
        ))}
      </div>
    </div>
  );
}
