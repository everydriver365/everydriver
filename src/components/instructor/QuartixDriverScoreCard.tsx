import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format, subDays } from "date-fns";

interface ScoreData {
  overall: number | null;
  speed: number | null;
  acceleration: number | null;
  braking: number | null;
  cornering: number | null;
  fatigue: number | null;
}

function TrendIcon({ current, previous }: { current: number | null; previous: number | null }) {
  if (current === null || previous === null) return <Minus className="h-3 w-3 text-muted-foreground" />;
  if (current > previous) return <TrendingUp className="h-3 w-3 text-emerald-500" />;
  if (current < previous) return <TrendingDown className="h-3 w-3 text-red-500" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

function ScoreGauge({ label, score, previousScore }: { label: string; score: number | null; previousScore: number | null }) {
  const color = score === null ? "text-muted-foreground" : score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-red-500";
  const bgColor = score === null ? "bg-muted" : score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";
  const percentage = score !== null ? Math.min(score, 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1">
          <span className={`text-sm font-semibold ${color}`}>
            {score !== null ? Math.round(score) : "—"}
          </span>
          <TrendIcon current={score} previous={previousScore} />
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${bgColor}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export function QuartixDriverScoreCard() {
  const { instructor } = useInstructorAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["quartix-my-scores", instructor?.id],
    queryFn: async () => {
      if (!instructor?.id) return null;

      // Get latest 14 days of scores
      const fromDate = format(subDays(new Date(), 14), "yyyy-MM-dd");
      const midDate = format(subDays(new Date(), 7), "yyyy-MM-dd");

      const { data: scores, error } = await supabase
        .from("quartix_driver_scores")
        .select("*")
        .eq("instructor_id", instructor.id)
        .gte("score_date", fromDate)
        .order("score_date", { ascending: false });

      if (error) throw error;
      if (!scores || scores.length === 0) return null;

      // Split into current week and previous week
      const current = scores.filter(s => s.score_date >= midDate);
      const previous = scores.filter(s => s.score_date < midDate);

      const avg = (arr: any[], field: string): number | null => {
        const vals = arr.map(s => s[field]).filter((v): v is number => v !== null);
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      };

      return {
        current: {
          overall: avg(current, "overall_score"),
          speed: avg(current, "speed_score"),
          acceleration: avg(current, "acceleration_score"),
          braking: avg(current, "braking_score"),
          cornering: avg(current, "cornering_score"),
          fatigue: avg(current, "fatigue_score"),
        } as ScoreData,
        previous: {
          overall: avg(previous, "overall_score"),
          speed: avg(previous, "speed_score"),
          acceleration: avg(previous, "acceleration_score"),
          braking: avg(previous, "braking_score"),
          cornering: avg(previous, "cornering_score"),
          fatigue: avg(previous, "fatigue_score"),
        } as ScoreData,
      };
    },
    enabled: !!instructor?.id,
  });

  // Check if instructor uses Quartix
  const { data: config } = useQuery({
    queryKey: ["tracking-config", instructor?.id],
    queryFn: async () => {
      if (!instructor?.id) return null;
      const { data } = await supabase
        .from("instructor_tracking_config")
        .select("provider")
        .eq("instructor_id", instructor.id)
        .maybeSingle();
      return data;
    },
    enabled: !!instructor?.id,
  });

  // Don't show if not using Quartix
  if (config?.provider !== "quartix") return null;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const current = data?.current;
  const previous = data?.previous;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4 text-amber-500" />
          Driver Score (This Week)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!current ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No scores yet — they'll appear once Quartix starts tracking
          </p>
        ) : (
          <>
            {/* Overall score highlight */}
            <div className="flex items-center justify-center gap-3 pb-2">
              <div className={`text-4xl font-bold ${
                (current.overall ?? 0) >= 80 ? "text-emerald-500" : 
                (current.overall ?? 0) >= 60 ? "text-amber-500" : "text-red-500"
              }`}>
                {current.overall !== null ? Math.round(current.overall) : "—"}
              </div>
              <div className="text-sm text-muted-foreground">
                <div>Overall</div>
                <div className="flex items-center gap-1">
                  <TrendIcon current={current.overall} previous={previous?.overall ?? null} />
                  <span className="text-xs">vs last week</span>
                </div>
              </div>
            </div>

            <ScoreGauge label="Speed" score={current.speed} previousScore={previous?.speed ?? null} />
            <ScoreGauge label="Acceleration" score={current.acceleration} previousScore={previous?.acceleration ?? null} />
            <ScoreGauge label="Braking" score={current.braking} previousScore={previous?.braking ?? null} />
            <ScoreGauge label="Cornering" score={current.cornering} previousScore={previous?.cornering ?? null} />
            <ScoreGauge label="Fatigue" score={current.fatigue} previousScore={previous?.fatigue ?? null} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
