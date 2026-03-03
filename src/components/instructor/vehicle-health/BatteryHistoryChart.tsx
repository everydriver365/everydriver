import { useMemo } from "react";
import { InstructorCard } from "@/components/instructor/InstructorCard";
import { BatteryHistoryEntry } from "@/hooks/useDeviceTelemetryHistory";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format } from "date-fns";
import { Battery, TrendingDown, TrendingUp } from "lucide-react";

interface BatteryHistoryChartProps {
  data: BatteryHistoryEntry[];
  isLoading?: boolean;
}

export function BatteryHistoryChart({ data, isLoading }: BatteryHistoryChartProps) {
  const chartData = useMemo(() => {
    return data.map(entry => ({
      time: new Date(entry.recorded_at).getTime(),
      battery: entry.battery_percent,
      label: format(new Date(entry.recorded_at), "HH:mm"),
    }));
  }, [data]);

  const trend = useMemo(() => {
    if (chartData.length < 2) return null;
    const first = chartData[0].battery;
    const last = chartData[chartData.length - 1].battery;
    const diff = last - first;
    return {
      direction: diff > 0 ? "up" : diff < 0 ? "down" : "stable",
      value: Math.abs(diff),
    };
  }, [chartData]);

  if (isLoading) {
    return (
      <InstructorCard>
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Battery className="h-4 w-4" />
          Battery History
        </h3>
        <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
          Loading...
        </div>
      </InstructorCard>
    );
  }

  if (chartData.length === 0) {
    return (
      <InstructorCard>
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Battery className="h-4 w-4" />
          Battery History
        </h3>
        <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
          No battery data recorded yet
        </div>
      </InstructorCard>
    );
  }

  return (
    <InstructorCard>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Battery className="h-4 w-4" />
          Battery History (24h)
        </h3>
        {trend && trend.direction !== "stable" && (
          <div className="flex items-center gap-1 text-xs">
            {trend.direction === "up" ? (
              <TrendingUp className="h-3 w-3 text-primary" />
            ) : (
              <TrendingDown className="h-3 w-3 text-destructive" />
            )}
            <span className={trend.direction === "up" ? "text-primary" : "text-destructive"}>
              {trend.value}%
            </span>
          </div>
        )}
      </div>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 10 }} 
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={[0, 100]} 
              tick={{ fontSize: 10 }} 
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip 
              contentStyle={{ 
                fontSize: 12, 
                background: "hsl(var(--card))", 
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
              }}
              formatter={(value: number) => [`${value}%`, "Battery"]}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <ReferenceLine y={20} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
            <Line 
              type="monotone" 
              dataKey="battery" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </InstructorCard>
  );
}