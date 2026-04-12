import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLessonPedalData } from '@/hooks/useLessonPedalData';
import { 
  Gauge, 
  RotateCcw, 
  Activity,
  Timer,
  ArrowDown,
  Settings2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { format } from 'date-fns';

interface PupilBrakeGearAnalysisProps {
  telematicsId: string;
  sessionDate?: string;
}

const GEAR_COLORS: Record<number, string> = {
  [-1]: 'hsl(var(--destructive))',
  0: 'hsl(var(--muted-foreground))',
  1: 'hsl(var(--primary))',
  2: 'hsl(210, 70%, 55%)',
  3: 'hsl(170, 60%, 45%)',
  4: 'hsl(140, 60%, 40%)',
  5: 'hsl(100, 50%, 40%)',
  6: 'hsl(60, 50%, 45%)',
};

const GEAR_LABELS: Record<number, string> = {
  [-1]: 'Reverse',
  0: 'Neutral',
  1: '1st',
  2: '2nd',
  3: '3rd',
  4: '4th',
  5: '5th',
  6: '6th',
};

const PupilBrakeGearAnalysis: React.FC<PupilBrakeGearAnalysisProps> = ({
  telematicsId,
  sessionDate,
}) => {
  const { data, isLoading, error } = useLessonPedalData(telematicsId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data || data.rawData.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Settings2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No brake/gear data recorded for this session</p>
          <p className="text-xs mt-1">Data is collected automatically during Geotab-tracked lessons</p>
        </CardContent>
      </Card>
    );
  }

  const { brake, gear, rawData } = data;

  // Prepare brake timeline data (sample every nth point for performance)
  const sampleRate = Math.max(1, Math.floor(rawData.length / 60));
  const brakeTimeline = rawData
    .filter((_, i) => i % sampleRate === 0)
    .filter(d => d.brake_pedal_pct != null)
    .map(d => ({
      time: format(new Date(d.recorded_at), 'HH:mm:ss'),
      brake: Math.round(d.brake_pedal_pct!),
    }));

  // Gear distribution chart data
  const gearChartData = Object.entries(gear.gearDistribution)
    .map(([g, secs]) => ({
      gear: GEAR_LABELS[Number(g)] || `G${g}`,
      seconds: Math.round(secs),
      gearNum: Number(g),
    }))
    .sort((a, b) => a.gearNum - b.gearNum);

  const smoothnessColor = brake.smoothnessScore >= 80 
    ? 'text-green-500' 
    : brake.smoothnessScore >= 50 
    ? 'text-amber-500' 
    : 'text-red-500';

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Brake Smoothness */}
        <Card>
          <CardContent className="p-4 text-center">
            <Gauge className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className={`text-2xl font-bold ${smoothnessColor}`}>{brake.smoothnessScore}</p>
            <p className="text-xs text-muted-foreground">Brake Smoothness</p>
          </CardContent>
        </Card>

        {/* Harsh Brakes */}
        <Card>
          <CardContent className="p-4 text-center">
            <ArrowDown className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-bold">{brake.harshBrakeCount}</p>
            <p className="text-xs text-muted-foreground">Harsh Brakes</p>
          </CardContent>
        </Card>

        {/* Reverse Manoeuvres */}
        <Card>
          <CardContent className="p-4 text-center">
            <RotateCcw className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-2xl font-bold">{gear.reverseManoeuvreCount}</p>
            <p className="text-xs text-muted-foreground">Reverse Manoeuvres</p>
          </CardContent>
        </Card>

        {/* Avg Reverse Duration */}
        <Card>
          <CardContent className="p-4 text-center">
            <Timer className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{gear.avgReverseDurationSec}s</p>
            <p className="text-xs text-muted-foreground">Avg Reverse Time</p>
          </CardContent>
        </Card>
      </div>

      {/* Brake Pedal Timeline */}
      {brakeTimeline.length > 2 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Brake Pedal Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={brakeTimeline}>
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 10 }} 
                    interval="preserveStartEnd" 
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10 }} 
                    width={30}
                    tickFormatter={v => `${v}%`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value}%`, 'Brake']}
                    labelStyle={{ fontSize: 11 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="brake"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Brake stats row */}
            <div className="flex justify-between mt-3 text-xs text-muted-foreground">
              <span>Avg: {brake.avgBrakePressure}%</span>
              <span>Max: {brake.maxBrakePressure}%</span>
              <span>Applications: {brake.brakeApplicationCount}</span>
            </div>

            {/* Smoothness progress bar */}
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Brake Smoothness</span>
                <span className={smoothnessColor}>
                  {brake.smoothnessScore >= 80 ? 'Smooth' : brake.smoothnessScore >= 50 ? 'Developing' : 'Needs Practice'}
                </span>
              </div>
              <Progress value={brake.smoothnessScore} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gear Distribution */}
      {gearChartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Gear Usage Distribution
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {gear.gearChangeCount} changes
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gearChartData}>
                  <XAxis dataKey="gear" tick={{ fontSize: 11 }} />
                  <YAxis 
                    tick={{ fontSize: 10 }} 
                    width={35}
                    tickFormatter={v => `${v}s`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value}s`, 'Time']}
                  />
                  <Bar dataKey="seconds" radius={[4, 4, 0, 0]}>
                    {gearChartData.map((entry) => (
                      <Cell 
                        key={entry.gear} 
                        fill={GEAR_COLORS[entry.gearNum] || 'hsl(var(--muted-foreground))'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Reverse summary */}
            {gear.reverseManoeuvreCount > 0 && (
              <div className="mt-3 p-2 bg-muted/50 rounded-2xl text-xs">
                <p className="font-medium">Reverse Practice Summary</p>
                <p className="text-muted-foreground mt-1">
                  {gear.reverseManoeuvreCount} manoeuvre{gear.reverseManoeuvreCount !== 1 ? 's' : ''} • 
                  Total {gear.totalReverseSec}s in reverse • 
                  Avg {gear.avgReverseDurationSec}s per manoeuvre
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PupilBrakeGearAnalysis;
