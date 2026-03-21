import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Car,
  Activity,
  ParkingCircle,
  Gauge,
  TrendingUp,
  Clock,
  Route,
  Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDriverTimesheets } from "@/hooks/useDriverTimesheets";
import { TrackedLessons } from "./TrackedLessons";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, subDays } from "date-fns";

interface FleetDashboardProps {
  instructorId: string;
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

const PIE_COLORS = [
  "hsl(142, 71%, 45%)",  // moving - success green
  "hsl(38, 92%, 50%)",   // idle - warning amber
  "hsl(215, 20%, 65%)",  // parked - muted
];

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

export function FleetDashboard({ instructorId }: FleetDashboardProps) {
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"7" | "14" | "30">("7");

  const fromDate = useMemo(() => subDays(new Date(), parseInt(range)), [range]);
  const toDate = useMemo(() => new Date(), [range]);
  const { timesheets, loading: tsLoading } = useDriverTimesheets(instructorId, fromDate, toDate);

  // Also fetch mileage_logs for daily mileage (more comprehensive than timesheets alone)
  const [mileageLogs, setMileageLogs] = useState<{ log_date: string; distance_km: number }[]>([]);
  const [mileageLoading, setMileageLoading] = useState(true);

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
  }, [instructorId, range]);

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

  // Compute statuses
  const statusCounts = { moving: 0, idle: 0, parked: 0 };
  devices.forEach(d => { statusCounts[getVehicleState(d)]++; });
  const pieData = [
    { name: "Moving", value: statusCounts.moving },
    { name: "Idle", value: statusCounts.idle },
    { name: "Parked", value: statusCounts.parked },
  ].filter(d => d.value > 0);

  // Daily mileage chart from mileage_logs (more comprehensive data source)
  const dailyMileage = mileageLogs
    .reduce((acc, log) => {
      const date = log.log_date;
      const existing = acc.find(a => a.date === date);
      const miles = kmToMiles(log.distance_km || 0);
      if (existing) {
        existing.miles += miles;
      } else {
        acc.push({ date, miles });
      }
      return acc;
    }, [] as { date: string; miles: number }[])
    .sort((a, b) => a.date.localeCompare(b.date));

  // Summary stats
  const totalMiles = dailyMileage.reduce((s, d) => s + d.miles, 0);
  const totalDrivingMins = timesheets.reduce((s, t) => s + (t.total_driving_minutes || 0), 0);
  const totalTrips = timesheets.reduce((s, t) => s + (t.trip_count || 0), 0);
  const avgDailyMiles = dailyMileage.length > 0 ? +(totalMiles / dailyMileage.length).toFixed(1) : 0;

  const utilizationPercent = devices.length > 0
    ? Math.round(((statusCounts.moving + statusCounts.idle) / devices.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Gauge className="h-5 w-5 text-primary" />
          Vehicle Intelligence
        </h2>
        <Select value={range} onValueChange={(v) => setRange(v as "7" | "14" | "30")}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border z-50">
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="14">14 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI strip */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Route className="h-3.5 w-3.5" />
              Total Miles
            </div>
            <p className="text-xl font-bold">{totalMiles.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">{avgDailyMiles} mi/day avg</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Clock className="h-3.5 w-3.5" />
              Driving Hours
            </div>
            <p className="text-xl font-bold">{(totalDrivingMins / 60).toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">{totalTrips} trips</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Car className="h-3.5 w-3.5" />
              Fleet
            </div>
            <p className="text-xl font-bold">{devices.length}</p>
            <p className="text-[10px] text-muted-foreground">{statusCounts.moving} active now</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Zap className="h-3.5 w-3.5" />
              Utilisation
            </div>
            <p className="text-xl font-bold">{utilizationPercent}%</p>
            <p className="text-[10px] text-muted-foreground">vehicles in use</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid gap-3 md:grid-cols-2">
        {/* Daily mileage bar chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Daily Mileage
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            {tsLoading || mileageLoading ? (
              <Skeleton className="h-48" />
            ) : dailyMileage.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No trip data for this period</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyMileage}>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => format(new Date(d), "dd MMM")}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis tick={{ fontSize: 10 }} width={35} />
                  <Tooltip
                    formatter={(v: number) => [`${v.toFixed(1)} mi`, "Miles"]}
                    labelFormatter={(d) => format(new Date(d as string), "EEE dd MMM")}
                  />
                  <Bar dataKey="miles" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Real-time status pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Real-Time Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            {devices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No vehicles configured</p>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={35}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[["Moving", "Idle", "Parked"].indexOf(pieData[i].name)]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ background: PIE_COLORS[0] }} />
                    <span>Moving ({statusCounts.moving})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ background: PIE_COLORS[1] }} />
                    <span>Idle ({statusCounts.idle})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ background: PIE_COLORS[2] }} />
                    <span>Parked ({statusCounts.parked})</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vehicle list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Vehicle Status</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="space-y-2">
            {devices.map(device => {
              const state = getVehicleState(device);
              return (
                <div key={device.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <div className="flex items-center gap-3">
                    {state === "moving" ? (
                      <Car className="h-4 w-4 text-success" />
                    ) : state === "idle" ? (
                      <Activity className="h-4 w-4 text-warning" />
                    ) : (
                      <ParkingCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{device.device_name || "Vehicle"}</p>
                      {device.last_road_name && (
                        <p className="text-xs text-muted-foreground">{device.last_road_name}</p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      state === "moving"
                        ? "bg-success/10 text-success"
                        : state === "idle"
                        ? "bg-warning/10 text-warning"
                        : "bg-muted/50 text-muted-foreground"
                    }
                  >
                    {state === "moving" ? `${Math.round((device.last_speed_kmh || 0) * 0.621371)} mph` : state}
                  </Badge>
                </div>
              );
            })}
            {devices.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No vehicles configured</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent tracked lessons widget */}
      <TrackedLessons instructorId={instructorId} compact limit={5} />
    </div>
  );
}
