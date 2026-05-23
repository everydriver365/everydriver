import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, TrendingUp, TrendingDown, Minus, Gauge, AlertTriangle, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface PupilTelematicsCardProps {
  pupilId: string;
}

interface TelematicsStats {
  avgScore: number;
  totalSessions: number;
  trend: 'improving' | 'steady' | 'declining';
  speedingCount: number;
  harshBrakingCount: number;
  sharpTurnCount: number;
}

export function PupilTelematicsCard({ pupilId }: PupilTelematicsCardProps) {
  const [stats, setStats] = useState<TelematicsStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTelematics = async () => {
      try {
        const { data: sessions } = await supabase
          .from("lesson_telematics")
          .select("id, local_score, created_at")
          .eq("pupil_id", pupilId)
          .order("created_at", { ascending: false })
          .limit(20);

        if (!sessions || sessions.length === 0) {
          setLoading(false);
          return;
        }

        const scores = sessions
          .map(s => s.local_score)
          .filter((s): s is number => s != null);
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

        // Determine trend
        let trend: 'improving' | 'steady' | 'declining' = 'steady';
        if (scores.length >= 4) {
          const half = Math.floor(scores.length / 2);
          const recentAvg = scores.slice(0, half).reduce((a, b) => a + b, 0) / half;
          const olderAvg = scores.slice(half).reduce((a, b) => a + b, 0) / (scores.length - half);
          if (recentAvg > olderAvg + 3) trend = 'improving';
          else if (recentAvg < olderAvg - 3) trend = 'declining';
        }

        // Fetch alerts
        const sessionIds = sessions.map(s => s.id);
        const { data: alerts } = await supabase
          .from("telematics_alerts")
          .select("alert_type")
          .in("telematics_id", sessionIds);

        const alertCounts = (alerts || []).reduce((acc, a) => {
          acc[a.alert_type] = (acc[a.alert_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        setStats({
          avgScore,
          totalSessions: sessions.length,
          trend,
          speedingCount: alertCounts['speeding'] || 0,
          harshBrakingCount: alertCounts['harsh_braking'] || alertCounts['hard_braking'] || 0,
          sharpTurnCount: alertCounts['sharp_turn'] || alertCounts['harsh_cornering'] || 0,
        });
      } catch (err) {
        console.error("Error fetching telematics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTelematics();
  }, [pupilId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Shield className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">No telematics data yet</p>
          <p className="text-xs text-muted-foreground mt-1">Complete lessons with GPS tracking to see your safety scores</p>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = stats.trend === 'improving' ? TrendingUp : stats.trend === 'declining' ? TrendingDown : Minus;
  const trendColor = stats.trend === 'improving' ? 'text-emerald-600' : stats.trend === 'declining' ? 'text-red-500' : 'text-amber-500';
  const trendLabel = stats.trend === 'improving' ? 'Improving' : stats.trend === 'declining' ? 'Needs Focus' : 'Steady';

  const scoreColor = stats.avgScore >= 80 ? 'text-emerald-600' : stats.avgScore >= 60 ? 'text-amber-500' : 'text-red-500';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          Safety Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Score */}
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-4xl font-bold ${scoreColor}`}>{stats.avgScore}</div>
            <div className="text-xs text-muted-foreground">out of 100</div>
          </div>
          <div className="text-right">
            <div className={`flex items-center gap-1 ${trendColor}`}>
              <TrendIcon className="h-4 w-4" />
              <span className="text-sm font-medium">{trendLabel}</span>
            </div>
            <div className="text-xs text-muted-foreground">{stats.totalSessions} sessions tracked</div>
          </div>
        </div>

        <Progress value={stats.avgScore} className="h-2" />

        {/* Alert Breakdown */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/50 rounded-lg p-2.5 text-center">
            <div className="h-6 w-6 rounded-md bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-1">
              <Gauge className="h-3.5 w-3.5 text-red-500" />
            </div>
            <div className="text-lg font-bold">{stats.speedingCount}</div>
            <div className="text-[10px] text-muted-foreground">Speeding</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2.5 text-center">
            <div className="h-6 w-6 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <div className="text-lg font-bold">{stats.harshBrakingCount}</div>
            <div className="text-[10px] text-muted-foreground">Hard Braking</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2.5 text-center">
            <div className="h-6 w-6 rounded-md bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-1">
              <Zap className="h-3.5 w-3.5 text-orange-500" />
            </div>
            <div className="text-lg font-bold">{stats.sharpTurnCount}</div>
            <div className="text-[10px] text-muted-foreground">Sharp Turns</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
