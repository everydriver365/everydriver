import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar } from "lucide-react";
import { useGeotabTrips } from "@/hooks/useGeotabTrips";
import { format } from "date-fns";

interface GeotabReportsTabProps {
  instructorId: string;
}

function kmToMiles(km: number): number {
  return km * 0.621371;
}

function kmhToMph(kmh: number): number {
  return kmh * 0.621371;
}

export function GeotabReportsTab({ instructorId }: GeotabReportsTabProps) {
  const [range, setRange] = useState(7);
  const fromDate = new Date(Date.now() - range * 24 * 60 * 60 * 1000);
  const toDate = new Date();
  const { data, isLoading } = useGeotabTrips(instructorId, fromDate, toDate);

  const generateReport = () => {
    if (!data?.trips || data.trips.length === 0) return;

    const lines = [
      `Geotab Trip Report`,
      `Period: ${format(fromDate, "dd MMM yyyy")} – ${format(toDate, "dd MMM yyyy")}`,
      `Total Trips: ${data.meta?.totalTrips || 0}`,
      `Total Distance: ${kmToMiles(data.meta?.totalDistanceKm || 0).toFixed(1)} miles`,
      `Total Drive Time: ${Math.floor((data.meta?.totalDurationMinutes || 0) / 60)}h ${(data.meta?.totalDurationMinutes || 0) % 60}m`,
      ``,
      `Date,Start,End,Distance (mi),Duration,Max Speed (mph),Idle (min)`,
      ...data.trips.map((t) =>
        [
          format(new Date(t.startTime), "dd/MM/yyyy"),
          format(new Date(t.startTime), "HH:mm"),
          t.endTime ? format(new Date(t.endTime), "HH:mm") : "-",
          kmToMiles(t.distanceKm).toFixed(1),
          `${t.durationMinutes}m`,
          kmhToMph(t.maxSpeedKmh).toFixed(0),
          t.idleMinutes,
        ].join(",")
      ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trip-report-${format(fromDate, "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Trip Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate a CSV report of all trips within a date range.
          </p>

          <div className="flex flex-wrap gap-2">
            {[7, 14, 30].map((d) => (
              <Button
                key={d}
                variant={range === d ? "default" : "outline"}
                size="sm"
                onClick={() => setRange(d)}
              >
                <Calendar className="h-3 w-3 mr-1" />
                Last {d} days
              </Button>
            ))}
          </div>

          {data?.meta && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{data.meta.totalTrips} trips</Badge>
              <Badge variant="secondary">
                {kmToMiles(data.meta.totalDistanceKm).toFixed(1)} miles
              </Badge>
            </div>
          )}

          <Button
            onClick={generateReport}
            disabled={isLoading || !data?.trips?.length}
          >
            <Download className="h-4 w-4 mr-2" />
            {isLoading ? "Loading…" : "Download CSV Report"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
