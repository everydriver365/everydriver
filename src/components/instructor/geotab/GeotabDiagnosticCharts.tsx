import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useGeotabStatusData, DiagnosticKey, DiagnosticSeries } from "@/hooks/useGeotabStatusData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Activity, Gauge, Droplets, Thermometer, Battery, Fuel } from "lucide-react";

interface GeotabDiagnosticChartsProps {
  instructorId: string;
}

const DIAGNOSTIC_OPTIONS: { key: DiagnosticKey; label: string; color: string; icon: React.ElementType }[] = [
  { key: "rpm", label: "RPM", color: "hsl(var(--primary))", icon: Activity },
  { key: "throttle", label: "Throttle", color: "hsl(var(--accent))", icon: Gauge },
  { key: "oilPressure", label: "Oil Pressure", color: "hsl(25, 95%, 53%)", icon: Droplets },
  { key: "coolantTemp", label: "Coolant Temp", color: "hsl(0, 84%, 60%)", icon: Thermometer },
  { key: "batteryVoltage", label: "Battery", color: "hsl(142, 76%, 36%)", icon: Battery },
  { key: "fuelLevel", label: "Fuel Level", color: "hsl(221, 83%, 53%)", icon: Fuel },
];

const RANGE_OPTIONS = [
  { label: "1h", hours: 1 },
  { label: "6h", hours: 6 },
  { label: "24h", hours: 24 },
  { label: "3d", hours: 72 },
  { label: "7d", hours: 168 },
];

export function GeotabDiagnosticCharts({ instructorId }: GeotabDiagnosticChartsProps) {
  const [selectedDiags, setSelectedDiags] = useState<DiagnosticKey[]>(["rpm", "throttle", "oilPressure"]);
  const [rangeHours, setRangeHours] = useState(24);

  const fromDate = useMemo(() => new Date(Date.now() - rangeHours * 60 * 60 * 1000), [rangeHours]);
  const toDate = useMemo(() => new Date(), [rangeHours]);

  const { data, isLoading, error } = useGeotabStatusData(instructorId, fromDate, toDate, selectedDiags);

  const toggleDiag = (key: DiagnosticKey) => {
    setSelectedDiags((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground mr-1">Sensors:</span>
        {DIAGNOSTIC_OPTIONS.map(({ key, label, icon: Icon }) => {
          const active = selectedDiags.includes(key);
          return (
            <Button
              key={key}
              variant={active ? "default" : "outline"}
              size="sm"
              className="text-xs h-7 gap-1"
              onClick={() => toggleDiag(key)}
            >
              <Icon className="h-3 w-3" />
              {label}
            </Button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground mr-1">Range:</span>
        {RANGE_OPTIONS.map(({ label, hours }) => (
          <Button
            key={hours}
            variant={rangeHours === hours ? "default" : "ghost"}
            size="sm"
            className="text-xs h-7"
            onClick={() => setRangeHours(hours)}
          >
            {label}
          </Button>
        ))}
        <Badge variant="outline" className="text-xs ml-auto">
          {format(fromDate, "dd MMM HH:mm")} – {format(toDate, "dd MMM HH:mm")}
        </Badge>
      </div>

      {/* Charts */}
      {isLoading ? (
        <div className="space-y-3">
          {selectedDiags.map((key) => (
            <Skeleton key={key} className="h-52 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center text-destructive">
            Failed to load diagnostics: {error.message}
          </CardContent>
        </Card>
      ) : !data?.series || Object.keys(data.series).length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No diagnostic data available for this period. Ensure your Geotab device supports the selected sensors.
          </CardContent>
        </Card>
      ) : (
        selectedDiags.map((diagKey) => {
          const series = data.series[diagKey];
          if (!series) return null;
          return (
            <DiagnosticChart
              key={diagKey}
              diagKey={diagKey}
              series={series}
              rangeHours={rangeHours}
            />
          );
        })
      )}
    </div>
  );
}

function DiagnosticChart({
  diagKey,
  series,
  rangeHours,
}: {
  diagKey: DiagnosticKey;
  series: DiagnosticSeries;
  rangeHours: number;
}) {
  const option = DIAGNOSTIC_OPTIONS.find((o) => o.key === diagKey);
  const Icon = option?.icon || Activity;
  const color = option?.color || "hsl(var(--primary))";

  // Downsample for performance (max ~300 points)
  const chartData = useMemo(() => {
    const raw = series.data;
    if (raw.length <= 300) return raw;
    const step = Math.ceil(raw.length / 300);
    return raw.filter((_, i) => i % step === 0);
  }, [series.data]);

  // Stats
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    const values = chartData.map((d) => d.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      count: series.data.length,
    };
  }, [chartData, series.data.length]);

  const timeFormat = rangeHours <= 6 ? "HH:mm" : rangeHours <= 72 ? "dd/MM HH:mm" : "dd MMM";

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Icon className="h-4 w-4" /> {series.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-xs text-muted-foreground py-6">
          No {series.label.toLowerCase()} data recorded in this period.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Icon className="h-4 w-4" /> {series.label}
          </CardTitle>
          {stats && (
            <div className="flex gap-3 text-[10px] text-muted-foreground">
              <span>Min: <strong>{stats.min.toFixed(1)}</strong></span>
              <span>Avg: <strong>{stats.avg.toFixed(1)}</strong></span>
              <span>Max: <strong>{stats.max.toFixed(1)}</strong></span>
              <span>{stats.count} pts</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="time"
              tickFormatter={(val) => {
                try { return format(new Date(val), timeFormat); } catch { return ""; }
              }}
              tick={{ fontSize: 10 }}
              className="text-muted-foreground"
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10 }}
              className="text-muted-foreground"
              width={45}
              label={{ value: series.unit, angle: -90, position: "insideLeft", style: { fontSize: 10 } }}
            />
            <Tooltip
              labelFormatter={(val) => {
                try { return format(new Date(val as string), "dd MMM yyyy HH:mm:ss"); } catch { return ""; }
              }}
              formatter={(value: number) => [`${value.toFixed(1)} ${series.unit}`, series.label]}
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
