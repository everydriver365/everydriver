import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGeotabStatusData, DiagnosticKey } from "@/hooks/useGeotabStatusData";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import {
  Gauge, Thermometer, Shield, CircleDot, ArrowDownUp, Timer, Navigation,
} from "lucide-react";

const SENSOR_CONFIG: Array<{
  key: DiagnosticKey;
  label: string;
  icon: typeof Gauge;
  format: (v: number) => string;
  color: string;
}> = [
  { key: "tyrePressure", label: "Tyre Pressure", icon: CircleDot, format: v => `${Math.round(v)} kPa`, color: "text-blue-500" },
  { key: "seatbelt", label: "Seatbelt", icon: Shield, format: v => v > 0 ? "Buckled" : "Unbuckled", color: "text-green-500" },
  { key: "brakePedal", label: "Brake Pedal", icon: Gauge, format: v => `${Math.round(v)}%`, color: "text-red-500" },
  { key: "reverseGear", label: "Current Gear", icon: ArrowDownUp, format: v => v < 0 ? "Reverse" : v === 0 ? "Neutral" : `Gear ${Math.round(v)}`, color: "text-amber-500" },
  { key: "ambientTemp", label: "Ambient Temp", icon: Thermometer, format: v => `${v.toFixed(1)}°C`, color: "text-cyan-500" },
  { key: "odometer", label: "Odometer", icon: Navigation, format: v => `${Math.round(v).toLocaleString()} km`, color: "text-purple-500" },
  { key: "engineHours", label: "Engine Hours", icon: Timer, format: v => `${Math.round(v).toLocaleString()} hrs`, color: "text-orange-500" },
];

interface GeotabExtendedDiagnosticsTabProps {
  instructorId?: string;
}

export function GeotabExtendedDiagnosticsTab({ instructorId }: GeotabExtendedDiagnosticsTabProps) {
  const { instructor } = useInstructorAuth();
  const targetId = instructorId || instructor?.id;

  const diagnosticKeys: DiagnosticKey[] = SENSOR_CONFIG.map(s => s.key);
  const { data, isLoading, error } = useGeotabStatusData(targetId, undefined, undefined, diagnosticKeys);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p className="text-sm">Unable to load extended diagnostics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {SENSOR_CONFIG.map(sensor => {
        const series = data?.series?.[sensor.key];
        const lastValue = series?.data?.length ? series.data[series.data.length - 1].value : null;
        const Icon = sensor.icon;

        return (
          <Card key={sensor.key} className="overflow-hidden">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className={`h-10 w-10 rounded-full bg-muted flex items-center justify-center ${sensor.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">{sensor.label}</p>
              {lastValue !== null ? (
                <p className="text-lg font-bold">{sensor.format(lastValue)}</p>
              ) : (
                <Badge variant="outline" className="text-xs">No data</Badge>
              )}
              {series?.data?.length ? (
                <p className="text-[10px] text-muted-foreground">
                  {series.data.length} readings
                </p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
