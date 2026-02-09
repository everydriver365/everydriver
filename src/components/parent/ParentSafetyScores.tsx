import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Shield, Gauge, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface ParentSafetyScoresProps {
  childId: string;
}

interface SessionScore {
  id: string;
  started_at: string;
  local_score: number | null;
  damoov_overall_score: number | null;
  damoov_braking_score: number | null;
  damoov_speeding_score: number | null;
  damoov_acceleration_score: number | null;
  damoov_cornering_score: number | null;
  harsh_brake_count: number | null;
  speeding_events_count: number | null;
  total_distance_km: number | null;
  max_speed_kmh: number | null;
}

interface AlertSummary {
  speeding: number;
  harsh_brake: number;
  harsh_accel: number;
  sharp_turn: number;
}

export function ParentSafetyScores({ childId }: ParentSafetyScoresProps) {
  const [sessions, setSessions] = useState<SessionScore[]>([]);
  const [alertSummary, setAlertSummary] = useState<AlertSummary>({ speeding: 0, harsh_brake: 0, harsh_accel: 0, sharp_turn: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [childId]);

  const fetchData = async () => {
    try {
      // Fetch recent telematics sessions
      const { data: telematicsData } = await supabase
        .from("lesson_telematics")
        .select(`
          id, started_at, local_score,
          damoov_overall_score, damoov_braking_score, damoov_speeding_score,
          damoov_acceleration_score, damoov_cornering_score,
          harsh_brake_count, speeding_events_count,
          total_distance_km, max_speed_kmh
        `)
        .eq("pupil_id", childId)
        .not("ended_at", "is", null)
        .order("started_at", { ascending: false })
        .limit(10);

      setSessions(telematicsData || []);

      // Fetch alert counts from recent sessions
      if (telematicsData && telematicsData.length > 0) {
        const sessionIds = telematicsData.map(s => s.id);
        const { data: alerts } = await supabase
          .from("telematics_alerts")
          .select("alert_type")
          .in("telematics_id", sessionIds);

        if (alerts) {
          const summary: AlertSummary = { speeding: 0, harsh_brake: 0, harsh_accel: 0, sharp_turn: 0 };
          alerts.forEach(a => {
            if (a.alert_type in summary) {
              summary[a.alert_type as keyof AlertSummary]++;
            }
          });
          setAlertSummary(summary);
        }
      }
    } catch (err) {
      console.error("Error fetching safety scores:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Safety Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4 text-sm">
            No telematics data available yet
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate averages
  const scoredSessions = sessions.filter(s => s.local_score || s.damoov_overall_score);
  const avgScore = scoredSessions.length > 0
    ? Math.round(scoredSessions.reduce((sum, s) => sum + (s.damoov_overall_score || s.local_score || 0), 0) / scoredSessions.length)
    : null;

  // Trend: compare first half vs second half
  const getTrend = () => {
    if (scoredSessions.length < 4) return "steady";
    const half = Math.floor(scoredSessions.length / 2);
    const recentAvg = scoredSessions.slice(0, half).reduce((s, x) => s + (x.damoov_overall_score || x.local_score || 0), 0) / half;
    const olderAvg = scoredSessions.slice(half).reduce((s, x) => s + (x.damoov_overall_score || x.local_score || 0), 0) / (scoredSessions.length - half);
    if (recentAvg > olderAvg + 3) return "improving";
    if (recentAvg < olderAvg - 3) return "declining";
    return "steady";
  };

  const trend = getTrend();
  const TrendIcon = trend === "improving" ? TrendingUp : trend === "declining" ? TrendingDown : Minus;
  const trendColor = trend === "improving" ? "text-emerald-600" : trend === "declining" ? "text-red-500" : "text-muted-foreground";

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  // Category averages from damoov scores
  const categoryScores = [
    { label: "Braking", key: "damoov_braking_score" as const },
    { label: "Acceleration", key: "damoov_acceleration_score" as const },
    { label: "Cornering", key: "damoov_cornering_score" as const },
    { label: "Speed", key: "damoov_speeding_score" as const },
  ].map(cat => {
    const vals = sessions.filter(s => s[cat.key] != null).map(s => s[cat.key]!);
    return { ...cat, avg: vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null };
  }).filter(c => c.avg != null);

  const totalAlerts = alertSummary.speeding + alertSummary.harsh_brake + alertSummary.harsh_accel + alertSummary.sharp_turn;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Safety Scores
          {avgScore != null && (
            <div className="ml-auto flex items-center gap-1.5">
              <TrendIcon className={cn("h-3.5 w-3.5", trendColor)} />
              <Badge variant={avgScore >= 80 ? "default" : avgScore >= 60 ? "secondary" : "destructive"} className="text-xs">
                {avgScore}/100
              </Badge>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        {avgScore != null && (
          <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10">
            <div className={cn("text-4xl font-bold", getScoreColor(avgScore))}>{avgScore}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Average Safety Score (last {scoredSessions.length} sessions)
            </div>
            <div className={cn("text-xs mt-1 flex items-center justify-center gap-1", trendColor)}>
              <TrendIcon className="h-3 w-3" />
              {trend === "improving" ? "Improving" : trend === "declining" ? "Needs attention" : "Steady"}
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        {categoryScores.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {categoryScores.map(cat => (
              <div key={cat.key} className="rounded-lg border p-2.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">{cat.label}</span>
                  <span className={cn("font-bold", getScoreColor(cat.avg!))}>{cat.avg}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", getScoreBg(cat.avg!))} style={{ width: `${cat.avg}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Alert Summary */}
        {totalAlerts > 0 && (
          <div className="rounded-xl border p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-medium">Recent Alerts</span>
              <Badge variant="outline" className="ml-auto text-[10px] h-4">{totalAlerts} total</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {alertSummary.speeding > 0 && (
                <div className="flex items-center justify-between text-xs p-1.5 rounded bg-red-50 dark:bg-red-950/20">
                  <span className="text-muted-foreground">Speeding</span>
                  <span className="font-bold text-red-600">{alertSummary.speeding}</span>
                </div>
              )}
              {alertSummary.harsh_brake > 0 && (
                <div className="flex items-center justify-between text-xs p-1.5 rounded bg-amber-50 dark:bg-amber-950/20">
                  <span className="text-muted-foreground">Hard Braking</span>
                  <span className="font-bold text-amber-600">{alertSummary.harsh_brake}</span>
                </div>
              )}
              {alertSummary.harsh_accel > 0 && (
                <div className="flex items-center justify-between text-xs p-1.5 rounded bg-orange-50 dark:bg-orange-950/20">
                  <span className="text-muted-foreground">Hard Accel</span>
                  <span className="font-bold text-orange-600">{alertSummary.harsh_accel}</span>
                </div>
              )}
              {alertSummary.sharp_turn > 0 && (
                <div className="flex items-center justify-between text-xs p-1.5 rounded bg-blue-50 dark:bg-blue-950/20">
                  <span className="text-muted-foreground">Sharp Turns</span>
                  <span className="font-bold text-blue-600">{alertSummary.sharp_turn}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Sessions */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Recent Sessions</h4>
          <div className="space-y-1.5">
            {sessions.slice(0, 5).map(s => {
              const score = s.damoov_overall_score || s.local_score;
              return (
                <div key={s.id} className="flex items-center justify-between p-2 rounded-lg border text-xs">
                  <div>
                    <span className="font-medium">{format(parseISO(s.started_at), "d MMM")}</span>
                    {s.total_distance_km != null && (
                      <span className="text-muted-foreground ml-2">
                        {s.total_distance_km.toFixed(1)} km
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {(s.harsh_brake_count || 0) > 0 && (
                      <Badge variant="outline" className="text-[9px] h-4 text-amber-600 border-amber-300">
                        {s.harsh_brake_count} brakes
                      </Badge>
                    )}
                    {score != null && (
                      <span className={cn("font-bold", getScoreColor(score))}>{Math.round(score)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
