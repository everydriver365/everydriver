import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import { GpsPoint } from "@/hooks/useTripReplay";
import { kmhToMph } from "@/lib/utils";

interface TripReplaySpeedChartProps {
  gpsPoints: GpsPoint[];
  currentIndex: number;
  onPointClick?: (index: number) => void;
}

export function TripReplaySpeedChart({
  gpsPoints,
  currentIndex,
  onPointClick,
}: TripReplaySpeedChartProps) {
  const chartData = useMemo(() => {
    if (gpsPoints.length === 0) return [];

    const startTime = new Date(gpsPoints[0].recorded_at).getTime();
    
    return gpsPoints.map((point, index) => {
      const time = new Date(point.recorded_at).getTime();
      const elapsedMinutes = (time - startTime) / 1000 / 60;
      
      return {
        index,
        time: elapsedMinutes,
        speed: Math.round(kmhToMph(point.speed_kmh || 0)),
        limit: point.speed_limit_kmh ? Math.round(kmhToMph(point.speed_limit_kmh)) : null,
        roadName: point.road_name,
        isSpeeding: point.speed_limit_kmh && (point.speed_kmh || 0) > point.speed_limit_kmh,
      };
    });
  }, [gpsPoints]);

  const currentPoint = chartData[currentIndex];
  const maxSpeed = Math.max(...chartData.map(d => Math.max(d.speed, d.limit || 0)), 70);

  const handleChartClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload?.index !== undefined && onPointClick) {
      onPointClick(data.activePayload[0].payload.index);
    }
  };

  if (chartData.length === 0) {
    return (
      <div className="h-[120px] flex items-center justify-center text-muted-foreground text-sm">
        No speed data available
      </div>
    );
  }

  return (
    <div className="h-[120px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={chartData} 
          onClick={handleChartClick}
          margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="limitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="time" 
            tickFormatter={(value) => `${Math.round(value)}m`}
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            domain={[0, maxSpeed + 10]}
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const data = payload[0].payload;
              return (
                <div className="bg-popover border rounded-none shadow-md p-2 text-xs">
                  <div className="font-medium">{data.speed} mph</div>
                  {data.limit && (
                    <div className={data.isSpeeding ? "text-destructive" : "text-muted-foreground"}>
                      Limit: {data.limit} mph
                    </div>
                  )}
                  {data.roadName && (
                    <div className="text-muted-foreground truncate max-w-32">{data.roadName}</div>
                  )}
                </div>
              );
            }}
          />
          {/* Speed limit area (background) */}
          <Area
            type="stepAfter"
            dataKey="limit"
            stroke="hsl(var(--destructive))"
            strokeWidth={1}
            strokeDasharray="4 4"
            fill="url(#limitGradient)"
            fillOpacity={1}
          />
          {/* Speed area */}
          <Area
            type="monotone"
            dataKey="speed"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#speedGradient)"
            fillOpacity={1}
          />
          {/* Current position marker */}
          {currentPoint && (
            <ReferenceDot
              x={currentPoint.time}
              y={currentPoint.speed}
              r={6}
              fill="hsl(var(--primary))"
              stroke="hsl(var(--background))"
              strokeWidth={2}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
