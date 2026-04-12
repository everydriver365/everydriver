import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Trophy,
  Medal,
  Shield,
  Zap,
  Gauge,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Crown,
  Car,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PupilScore {
  pupilId: string;
  pupilName: string;
  avatarUrl: string | null;
  sessions: number;
  totalKm: number;
  avgScore: number;
  speedingCount: number;
  harshBrakeCount: number;
  harshAccelCount: number;
  sharpTurnCount: number;
  // Derived sub-scores (0-100, higher = better)
  brakingScore: number;
  accelerationScore: number;
  speedScore: number;
  corneringScore: number;
}

interface PupilDrivingLeaderboardProps {
  instructorId: string;
}

export function PupilDrivingLeaderboard({ instructorId }: PupilDrivingLeaderboardProps) {
  const [scores, setScores] = useState<PupilScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"overall" | "speed" | "braking" | "accel" | "cornering">("overall");

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // Fetch telematics sessions with pupil info
      const { data: sessions, error: sessError } = await supabase
        .from("lesson_telematics")
        .select(`
          id, pupil_id, local_score, total_distance_km,
          harsh_brake_count, speeding_events_count,
          pupils!inner(id, name, profile_image_url)
        `)
        .eq("instructor_id", instructorId)
        .not("pupil_id", "is", null);

      if (sessError) throw sessError;
      if (!sessions?.length) { setScores([]); return; }

      // Fetch alert counts grouped by pupil
      const telematicsIds = sessions.map(s => s.id);
      const { data: alerts } = await supabase
        .from("telematics_alerts")
        .select("telematics_id, alert_type")
        .in("telematics_id", telematicsIds);

      // Build alert map: telematics_id -> { type -> count }
      const alertMap = new Map<string, Record<string, number>>();
      for (const a of alerts || []) {
        const m = alertMap.get(a.telematics_id) || {};
        m[a.alert_type] = (m[a.alert_type] || 0) + 1;
        alertMap.set(a.telematics_id, m);
      }

      // Aggregate per pupil
      const pupilMap = new Map<string, {
        name: string;
        avatar: string | null;
        sessions: number;
        totalKm: number;
        scoreSum: number;
        scoreCount: number;
        speeding: number;
        brakes: number;
        accels: number;
        turns: number;
      }>();

      for (const s of sessions) {
        const pid = s.pupil_id!;
        const pupil = s.pupils as any;
        const existing = pupilMap.get(pid) || {
          name: pupil?.name || "Unknown",
          avatar: pupil?.profile_image_url || null,
          sessions: 0, totalKm: 0, scoreSum: 0, scoreCount: 0,
          speeding: 0, brakes: 0, accels: 0, turns: 0,
        };

        existing.sessions += 1;
        existing.totalKm += Number(s.total_distance_km || 0);
        if (s.local_score != null) {
          existing.scoreSum += s.local_score;
          existing.scoreCount += 1;
        }
        existing.speeding += s.speeding_events_count || 0;
        existing.brakes += s.harsh_brake_count || 0;

        // Add from alerts
        const a = alertMap.get(s.id) || {};
        existing.speeding += a["speeding"] || 0;
        existing.brakes += a["harsh_brake"] || 0;
        existing.accels += a["harsh_accel"] || 0;
        existing.turns += a["sharp_turn"] || 0;

        pupilMap.set(pid, existing);
      }

      // Convert to scores
      const result: PupilScore[] = [];
      for (const [pid, p] of pupilMap) {
        if (p.sessions < 1) continue;
        const avgScore = p.scoreCount > 0 ? Math.round(p.scoreSum / p.scoreCount) : 100;
        const perSession = (count: number) => count / p.sessions;

        // Sub-scores: 100 minus penalty per event (capped at 0)
        const brakingScore = Math.max(0, Math.round(100 - perSession(p.brakes) * 15));
        const accelerationScore = Math.max(0, Math.round(100 - perSession(p.accels) * 15));
        const speedScore = Math.max(0, Math.round(100 - perSession(p.speeding) * 10));
        const corneringScore = Math.max(0, Math.round(100 - perSession(p.turns) * 15));

        result.push({
          pupilId: pid,
          pupilName: p.name,
          avatarUrl: p.avatar,
          sessions: p.sessions,
          totalKm: p.totalKm,
          avgScore,
          speedingCount: p.speeding,
          harshBrakeCount: p.brakes,
          harshAccelCount: p.accels,
          sharpTurnCount: p.turns,
          brakingScore,
          accelerationScore,
          speedScore,
          corneringScore,
        });
      }

      setScores(result);
    } catch (err) {
      console.error("[Leaderboard] Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (instructorId) fetchLeaderboard();
  }, [instructorId]);

  const sorted = useMemo(() => {
    const key = sortBy === "overall" ? "avgScore"
      : sortBy === "speed" ? "speedScore"
      : sortBy === "braking" ? "brakingScore"
      : sortBy === "accel" ? "accelerationScore"
      : "corneringScore";
    return [...scores].sort((a, b) => (b as any)[key] - (a as any)[key]);
  }, [scores, sortBy]);

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-500";
    return "text-destructive";
  };

  const scoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-destructive";
  };

  const rankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-amber-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-slate-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-xs font-bold text-muted-foreground w-5 text-center">{index + 1}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {([
            { key: "overall", label: "Overall", icon: Trophy },
            { key: "speed", label: "Speed", icon: Gauge },
            { key: "braking", label: "Braking", icon: Shield },
            { key: "accel", label: "Accel", icon: Zap },
            { key: "cornering", label: "Cornering", icon: TrendingUp },
          ] as const).map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={sortBy === key ? "default" : "outline"}
              size="sm"
              className="h-7 text-[11px] gap-1 px-2"
              onClick={() => setSortBy(key)}
            >
              <Icon className="h-3 w-3" />
              {label}
            </Button>
          ))}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchLeaderboard} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Leaderboard */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
      ) : scores.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <Trophy className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No driving data yet</p>
            <p className="text-xs mt-1">Scores will appear after tracked lessons with assigned pupils</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-340px)]">
          <div className="space-y-2 pr-2">
            {sorted.map((pupil, idx) => (
              <div
                key={pupil.pupilId}
                className={`rounded-2xl p-3 space-y-2 ${
                  idx === 0 ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800" : "bg-muted/30"
                }`}
              >
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 flex items-center justify-center w-6">
                    {rankIcon(idx)}
                  </div>
                  {pupil.avatarUrl ? (
                    <img src={pupil.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {pupil.pupilName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{pupil.pupilName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {pupil.sessions} session{pupil.sessions !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className={`text-2xl font-bold ${scoreColor(pupil.avgScore)}`}>
                    {pupil.avgScore}
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-4 gap-2 ml-9">
                  {([
                    { label: "Speed", score: pupil.speedScore, events: pupil.speedingCount, icon: Gauge },
                    { label: "Braking", score: pupil.brakingScore, events: pupil.harshBrakeCount, icon: Shield },
                    { label: "Accel", score: pupil.accelerationScore, events: pupil.harshAccelCount, icon: Zap },
                    { label: "Cornering", score: pupil.corneringScore, events: pupil.sharpTurnCount, icon: TrendingUp },
                  ] as const).map(({ label, score, events, icon: Icon }) => (
                    <div key={label} className="text-center">
                      <div className={`text-sm font-bold ${scoreColor(score)}`}>{score}</div>
                      <div className="h-1 rounded-full bg-muted mt-0.5 overflow-hidden">
                        <div className={`h-full rounded-full ${scoreBg(score)}`} style={{ width: `${score}%` }} />
                      </div>
                      <div className="text-[9px] text-muted-foreground mt-0.5 flex items-center justify-center gap-0.5">
                        <Icon className="h-2.5 w-2.5" />
                        {label}
                      </div>
                      {events > 0 && (
                        <div className="text-[9px] text-destructive mt-0.5">{events} event{events !== 1 ? "s" : ""}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
