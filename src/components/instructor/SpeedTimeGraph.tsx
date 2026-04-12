import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface SpeedDataPoint {
  elapsedMinutes: number;
  elapsedLabel: string;
  speed: number;
  speedLimit: number | null;
  roadName: string | null;
}

interface RoutePoint {
  lat: number;
  lon: number;
  speed: number | null;
  recordedAt: string;
  speedLimit?: number | null;
  roadName?: string | null;
}

interface SpeedTimeGraphProps {
  route: RoutePoint[];
  startedAt: string;
  className?: string;
}

const SpeedTimeGraph: React.FC<SpeedTimeGraphProps> = ({ route, startedAt, className = '' }) => {
  const data = useMemo(() => {
    if (!route || route.length === 0) return [];

    const startTime = new Date(startedAt).getTime();
    
    // Sample points to avoid overcrowding (max 100 points for smooth rendering)
    const step = Math.max(1, Math.floor(route.length / 100));
    const sampledPoints = route.filter((_, i) => i % step === 0 || i === route.length - 1);
    
    return sampledPoints.map((point): SpeedDataPoint => {
      const pointTime = new Date(point.recordedAt).getTime();
      const elapsedMs = pointTime - startTime;
      const elapsedMinutes = elapsedMs / 1000 / 60;
      
      // Format time label
      const totalSeconds = Math.floor(elapsedMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      let elapsedLabel: string;
      if (hours > 0) {
        elapsedLabel = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        elapsedLabel = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
      
      // Convert speed from km/h to mph
      const speedMph = point.speed != null ? Math.round(point.speed * 0.621371) : 0;
      const speedLimitMph = point.speedLimit != null ? Math.round(point.speedLimit * 0.621371) : null;
      
      return {
        elapsedMinutes,
        elapsedLabel,
        speed: speedMph,
        speedLimit: speedLimitMph,
        roadName: point.roadName || null,
      };
    });
  }, [route, startedAt]);

  // Calculate average speed limit for reference line
  const avgSpeedLimit = useMemo(() => {
    const limitsWithValues = data.filter(d => d.speedLimit !== null);
    if (limitsWithValues.length === 0) return null;
    const sum = limitsWithValues.reduce((acc, d) => acc + (d.speedLimit || 0), 0);
    return Math.round(sum / limitsWithValues.length);
  }, [data]);

  // Calculate stats
  const avgSpeed = useMemo(() => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, d) => acc + d.speed, 0);
    return Math.round(sum / data.length);
  }, [data]);

  const maxSpeed = useMemo(() => {
    if (data.length === 0) return 0;
    return Math.max(...data.map(d => d.speed));
  }, [data]);

  if (data.length < 2) {
    return (
      <div className={`bg-muted/30 rounded-2xl p-4 text-center ${className}`}>
        <p className="text-sm text-muted-foreground">Not enough data points for speed graph</p>
      </div>
    );
  }

  // Format X-axis ticks - show fewer labels for cleaner look
  const formatXAxis = (value: number, index: number): string => {
    const point = data.find(d => Math.abs(d.elapsedMinutes - value) < 0.1);
    if (!point) return '';
    // Only show label for first, middle and last
    const totalPoints = data.length;
    if (index === 0 || index === Math.floor(totalPoints / 2) || index === totalPoints - 1) {
      return point.elapsedLabel;
    }
    return '';
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={150}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          
          <XAxis 
            dataKey="elapsedMinutes"
            tickFormatter={formatXAxis}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          
          <YAxis 
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            tickCount={4}
            domain={[0, 'auto']}
            unit=" mph"
          />
          
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const d = payload[0].payload as SpeedDataPoint;
              return (
                <div className="bg-popover border border-border rounded-2xl p-2 shadow-lg text-xs">
                  <p className="font-medium">{d.elapsedLabel}</p>
                  <p className="text-primary">{d.speed} mph</p>
                  {d.speedLimit && (
                    <p className="text-muted-foreground">Limit: {d.speedLimit} mph</p>
                  )}
                  {d.roadName && (
                    <p className="text-muted-foreground truncate max-w-[150px]">{d.roadName}</p>
                  )}
                </div>
              );
            }}
          />
          
          {avgSpeedLimit && (
            <ReferenceLine 
              y={avgSpeedLimit} 
              stroke="hsl(var(--destructive))" 
              strokeDasharray="4 4"
              strokeOpacity={0.6}
            />
          )}
          
          <Area
            type="monotone"
            dataKey="speed"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#speedGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Stats row */}
      <div className="flex items-center justify-between mt-2 px-1">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Avg: <span className="font-medium text-foreground">{avgSpeed} mph</span></span>
          <span>Max: <span className="font-medium text-foreground">{maxSpeed} mph</span></span>
        </div>
        {avgSpeedLimit && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="w-3 h-0.5 bg-destructive/60" style={{ borderStyle: 'dashed' }}></span>
            <span>Avg limit: {avgSpeedLimit} mph</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeedTimeGraph;
