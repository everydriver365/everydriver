import { useState, useEffect, useMemo } from "react";
import { Gauge, AlertTriangle, TrendingDown, TrendingUp, Shield, Zap, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Alert {
  id: string;
  alert_type: string;
  severity: string;
  speed_kmh: number | null;
  speed_limit_kmh: number | null;
  speed_delta: number | null;
  latitude: number | null;
  longitude: number | null;
  road_name: string | null;
  created_at: string;
}

interface SessionSummary {
  id: string;
  started_at: string | null;
  ended_at: string | null;
  total_distance_km: number | null;
  max_speed_kmh: number | null;
  avg_speed_kmh: number | null;
}

interface PupilDrivingStyleReportProps {
  pupilId: string;
  brandColour?: string | null;
}

const alertTypeLabels: Record<string, string> = {
  speeding: "Speeding",
  harsh_brake: "Harsh Braking",
  harsh_accel: "Harsh Acceleration",
  sharp_turn: "Sharp Turn",
};

const alertTypeIcons: Record<string, React.ElementType> = {
  speeding: Gauge,
  harsh_brake: TrendingDown,
  harsh_accel: Zap,
  sharp_turn: Activity,
};

const severityColors: Record<string, string> = {
  low: "hsl(var(--warning, 45 93% 47%))",
  medium: "hsl(35 100% 50%)",
  high: "hsl(var(--destructive))",
};

export function PupilDrivingStyleReport({ pupilId, brandColour }: PupilDrivingStyleReportProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch telematics sessions for this pupil
      const { data: sessionsData } = await (supabase.from("lesson_telematics" as any) as any)
        .select("id, started_at, ended_at, total_distance_km, max_speed_kmh, avg_speed_kmh")
        .eq("pupil_id", pupilId)
        .order("started_at", { ascending: false })
        .limit(50);

      const sessionsList = (sessionsData || []) as SessionSummary[];
      setSessions(sessionsList);

      if (sessionsList.length > 0) {
        const sessionIds = sessionsList.map((s) => s.id);
        const { data: alertsData } = await (supabase.from("telematics_alerts" as any) as any)
          .select("id, alert_type, severity, speed_kmh, speed_limit_kmh, speed_delta, latitude, longitude, road_name, created_at")
          .in("telematics_id", sessionIds)
          .order("created_at", { ascending: false })
          .limit(200);

        setAlerts((alertsData || []) as Alert[]);
      }

      setLoading(false);
    };
    fetchData();
  }, [pupilId]);

  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const totalAlerts = alerts.length;
    const speedingAlerts = alerts.filter((a) => a.alert_type === "speeding").length;
    const harshBrakes = alerts.filter((a) => a.alert_type === "harsh_brake").length;
    const harshAccels = alerts.filter((a) => a.alert_type === "harsh_accel").length;
    const highSeverity = alerts.filter((a) => a.severity === "high").length;

    // Simple safety score: start at 100, deduct for events
    const deductions = highSeverity * 5 + (totalAlerts - highSeverity) * 2;
    const safetyScore = Math.max(0, Math.min(100, 100 - deductions));

    return { totalSessions, totalAlerts, speedingAlerts, harshBrakes, harshAccels, highSeverity, safetyScore };
  }, [alerts, sessions]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground text-sm">
          Loading driving report...
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="px-4 space-y-4">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Shield className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No driving data yet</p>
            <p className="text-xs mt-1">Your driving style report will appear after tracked lessons</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 space-y-4">
      {/* Safety Score Hero */}
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-5">
            <div className="relative h-20 w-20 shrink-0">
              <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none"
                  stroke={stats.safetyScore >= 80 ? "hsl(142 76% 36%)" : stats.safetyScore >= 50 ? "hsl(35 100% 50%)" : "hsl(var(--destructive))"}
                  strokeWidth="3"
                  strokeDasharray={`${stats.safetyScore} ${100 - stats.safetyScore}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-foreground">{stats.safetyScore}</span>
                <span className="text-[9px] text-muted-foreground">/ 100</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-foreground">Safety Score</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Based on {stats.totalSessions} tracked session{stats.totalSessions !== 1 ? "s" : ""}
              </p>
              <div className="mt-2">
                <Badge
                  variant="secondary"
                  className="text-xs"
                  style={{
                    backgroundColor: stats.safetyScore >= 80 ? "hsl(142 76% 36% / 0.1)" : stats.safetyScore >= 50 ? "hsl(35 100% 50% / 0.1)" : "hsl(var(--destructive) / 0.1)",
                    color: stats.safetyScore >= 80 ? "hsl(142 76% 36%)" : stats.safetyScore >= 50 ? "hsl(35 100% 50%)" : "hsl(var(--destructive))",
                  }}
                >
                  {stats.safetyScore >= 80 ? "Excellent" : stats.safetyScore >= 60 ? "Good" : stats.safetyScore >= 40 ? "Needs Work" : "Attention Needed"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Speeding", count: stats.speedingAlerts, icon: Gauge, color: "hsl(var(--destructive))" },
          { label: "Hard Brakes", count: stats.harshBrakes, icon: TrendingDown, color: "hsl(35 100% 50%)" },
          { label: "Hard Accel", count: stats.harshAccels, icon: Zap, color: "hsl(250 80% 60%)" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-3 text-center">
              <item.icon className="h-5 w-5 mx-auto mb-1" style={{ color: item.color }} />
              <p className="text-xl font-bold text-foreground">{item.count}</p>
              <p className="text-[10px] text-muted-foreground">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Recent Events
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border max-h-72 overflow-y-auto">
              {alerts.slice(0, 20).map((alert) => {
                const IconComp = alertTypeIcons[alert.alert_type] || AlertTriangle;
                return (
                  <div key={alert.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${severityColors[alert.severity] || severityColors.low}15`,
                        color: severityColors[alert.severity] || severityColors.low,
                      }}
                    >
                      <IconComp className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {alertTypeLabels[alert.alert_type] || alert.alert_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {alert.road_name && `${alert.road_name} · `}
                        {alert.speed_kmh && alert.speed_limit_kmh
                          ? `${Math.round(alert.speed_kmh * 0.621371)} mph in ${Math.round(alert.speed_limit_kmh * 0.621371)} mph zone`
                          : alert.speed_delta
                            ? `${Math.round(Math.abs(alert.speed_delta) * 0.621371)} mph change`
                            : ""
                        }
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge
                        variant="outline"
                        className="text-[10px] capitalize"
                        style={{ borderColor: severityColors[alert.severity], color: severityColors[alert.severity] }}
                      >
                        {alert.severity}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {format(new Date(alert.created_at), "d MMM")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
