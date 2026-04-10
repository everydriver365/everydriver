import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { BarChart3, TrendingUp, Clock, Fuel } from "lucide-react";
import { useDriverTimesheets } from "@/hooks/useDriverTimesheets";
import { format, subDays } from "date-fns";

interface UsageAnalyticsProps {
  instructorId: string;
}

const kmToMiles = (km: number) => +(km * 0.621371).toFixed(1);

export function UsageAnalytics({ instructorId }: UsageAnalyticsProps) {
  const [range, setRange] = useState<"7" | "14" | "30">("14");
  const fromDate = useMemo(() => subDays(new Date(), parseInt(range)), [range]);
  const toDate = useMemo(() => new Date(), [range]);
  const { timesheets, loading } = useDriverTimesheets(instructorId, fromDate, toDate);

  // Aggregate by date
  const byDate = timesheets.reduce((acc, ts) => {
    const d = ts.sheet_date;
    const existing = acc.get(d);
    if (existing) {
      existing.drivingHrs += (ts.total_driving_minutes || 0) / 60;
      existing.idleHrs += (ts.total_idle_minutes || 0) / 60;
      existing.miles += kmToMiles(ts.total_distance_km || 0);
      existing.trips += ts.trip_count || 0;
    } else {
      acc.set(d, {
        date: d,
        drivingHrs: (ts.total_driving_minutes || 0) / 60,
        idleHrs: (ts.total_idle_minutes || 0) / 60,
        miles: kmToMiles(ts.total_distance_km || 0),
        trips: ts.trip_count || 0,
      });
    }
    return acc;
  }, new Map<string, { date: string; drivingHrs: number; idleHrs: number; miles: number; trips: number }>());

  const chartData = Array.from(byDate.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      ...d,
      drivingHrs: +d.drivingHrs.toFixed(1),
      idleHrs: +d.idleHrs.toFixed(1),
      miles: +d.miles.toFixed(1),
    }));

  // Peak hours heatmap: group trips by hour
  const hourCounts = new Array(24).fill(0);
  timesheets.forEach(ts => {
    if (ts.first_trip_start) {
      const hour = new Date(ts.first_trip_start).getHours();
      hourCounts[hour]++;
    }
    if (ts.last_trip_end) {
      const hour = new Date(ts.last_trip_end).getHours();
      hourCounts[hour]++;
    }
  });
  const maxCount = Math.max(...hourCounts, 1);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Usage Analytics
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

      {chartData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No driving data for this period</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {/* Hours driven per day - stacked bar (driving vs idle) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Daily Hours (Driving vs Idle)
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), "dd/MM")} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={30} />
                  <Tooltip
                    formatter={(v: number, name: string) => [`${v}h`, name === "drivingHrs" ? "Driving" : "Idle"]}
                    labelFormatter={(d) => format(new Date(d as string), "EEE dd MMM")}
                  />
                  <Legend formatter={(v) => (v === "drivingHrs" ? "Driving" : "Idle")} />
                  <Bar dataKey="drivingHrs" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="idleHrs" stackId="a" fill="hsl(var(--chart-3))" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Miles per day trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Miles Per Day
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), "dd/MM")} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={35} />
                  <Tooltip
                    formatter={(v: number) => [`${v} mi`, "Miles"]}
                    labelFormatter={(d) => format(new Date(d as string), "EEE dd MMM")}
                  />
                  <Line type="monotone" dataKey="miles" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Peak activity hours heatmap */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Fuel className="h-4 w-4" />
                Peak Activity Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="grid grid-cols-12 gap-1">
                {hourCounts.map((count, hour) => {
                  const intensity = count / maxCount;
                  return (
                    <div key={hour} className="text-center">
                      <div
                        className="h-8 rounded-none mb-1 transition-colors"
                        style={{
                          backgroundColor: intensity > 0
                            ? `hsl(var(--primary) / ${0.15 + intensity * 0.75})`
                            : "hsl(var(--muted) / 0.3)",
                        }}
                        title={`${hour}:00 — ${count} trips`}
                      />
                      <span className="text-[9px] text-muted-foreground">
                        {hour % 3 === 0 ? `${hour}` : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-end gap-2 mt-2">
                <span className="text-[10px] text-muted-foreground">Less</span>
                {[0.15, 0.35, 0.55, 0.75, 0.9].map((op, i) => (
                  <div
                    key={i}
                    className="h-3 w-3 rounded-none"
                    style={{ backgroundColor: `hsl(var(--primary) / ${op})` }}
                  />
                ))}
                <span className="text-[10px] text-muted-foreground">More</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
