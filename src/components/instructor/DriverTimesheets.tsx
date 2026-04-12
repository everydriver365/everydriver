import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  MapPin,
  Timer,
  Route,
  CalendarDays,
  RefreshCw,
  TrendingUp,
  Car,
} from "lucide-react";
import { useDriverTimesheets, DriverTimesheet } from "@/hooks/useDriverTimesheets";
import { kmToMiles } from "@/lib/utils";

interface DriverTimesheetsProps {
  instructorId: string;
}

export function DriverTimesheets({ instructorId }: DriverTimesheetsProps) {
  const [range, setRange] = useState<"7d" | "14d" | "30d">("7d");

  const fromDate = useMemo(() => {
    const days = range === "7d" ? 7 : range === "14d" ? 14 : 30;
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  }, [range]);

  const { timesheets, loading, error, refetch } = useDriverTimesheets(
    instructorId,
    fromDate,
    new Date()
  );

  const formatDuration = (minutes: number) => {
    if (!minutes) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return "—";
    try {
      return format(new Date(iso), "h:mm a");
    } catch {
      return "—";
    }
  };

  // Summary totals
  const totals = useMemo(() => {
    return timesheets.reduce(
      (acc, t) => ({
        driving: acc.driving + t.total_driving_minutes,
        idle: acc.idle + t.total_idle_minutes,
        distance: acc.distance + t.total_distance_km,
        trips: acc.trips + t.trip_count,
        days: acc.days + 1,
      }),
      { driving: 0, idle: 0, distance: 0, trips: 0, days: 0 }
    );
  }, [timesheets]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["7d", "14d", "30d"] as const).map((r) => (
            <Button
              key={r}
              variant={range === r ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setRange(r)}
            >
              {r === "7d" ? "7 Days" : r === "14d" ? "14 Days" : "30 Days"}
            </Button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={refetch}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Summary Cards */}
      {!loading && timesheets.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-muted/50 rounded-2xl p-2.5 text-center">
            <div className="text-lg font-bold">{totals.days}</div>
            <div className="text-[10px] text-muted-foreground">Days Active</div>
          </div>
          <div className="bg-muted/50 rounded-2xl p-2.5 text-center">
            <div className="text-lg font-bold">{formatDuration(totals.driving)}</div>
            <div className="text-[10px] text-muted-foreground">Driving</div>
          </div>
          <div className="bg-muted/50 rounded-2xl p-2.5 text-center">
            <div className="text-lg font-bold">{formatDuration(totals.idle)}</div>
            <div className="text-[10px] text-muted-foreground">Idle</div>
          </div>
          <div className="bg-muted/50 rounded-2xl p-2.5 text-center">
            <div className="text-lg font-bold">{kmToMiles(totals.distance).toFixed(0)}</div>
            <div className="text-[10px] text-muted-foreground">Miles</div>
          </div>
        </div>
      )}

      {/* Timesheet List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-4 text-center text-muted-foreground text-sm">
            {error}
          </CardContent>
        </Card>
      ) : timesheets.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No timesheet data yet</p>
            <p className="text-xs mt-1">
              Timesheets are automatically generated from your GPS trips
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-380px)]">
          <div className="space-y-2 pr-2">
            {timesheets.map((ts) => (
              <TimesheetRow key={ts.id} timesheet={ts} formatDuration={formatDuration} formatTime={formatTime} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

function TimesheetRow({
  timesheet: ts,
  formatDuration,
  formatTime,
}: {
  timesheet: DriverTimesheet;
  formatDuration: (m: number) => string;
  formatTime: (iso: string | null) => string;
}) {
  const workingHours =
    ts.first_trip_start && ts.last_trip_end
      ? (new Date(ts.last_trip_end).getTime() - new Date(ts.first_trip_start).getTime()) /
        60000
      : null;

  return (
    <div className="bg-muted/30 rounded-2xl p-3 space-y-2">
      {/* Date header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">
            {format(new Date(ts.sheet_date + "T00:00:00"), "EEE, d MMM yyyy")}
          </span>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {ts.trip_count} trip{ts.trip_count !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Time range */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatTime(ts.first_trip_start)} – {formatTime(ts.last_trip_end)}
        </div>
        {workingHours != null && workingHours > 0 && (
          <div className="flex items-center gap-1 text-foreground font-medium">
            <TrendingUp className="h-3 w-3" />
            {formatDuration(workingHours)} on duty
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Car className="h-3 w-3" />
          {formatDuration(ts.total_driving_minutes)} driving
        </div>
        {ts.total_idle_minutes > 0 && (
          <div className="flex items-center gap-1 text-amber-600">
            <Timer className="h-3 w-3" />
            {formatDuration(ts.total_idle_minutes)} idle
          </div>
        )}
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {kmToMiles(ts.total_distance_km).toFixed(1)} mi
        </div>
      </div>
    </div>
  );
}
