import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format, subDays } from "date-fns";

interface DriverScore {
  id: string;
  instructor_id: string;
  quartix_driver_id: string;
  score_date: string;
  overall_score: number | null;
  speed_score: number | null;
  acceleration_score: number | null;
  braking_score: number | null;
  cornering_score: number | null;
  fatigue_score: number | null;
  instructor_name?: string;
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground">—</span>;
  
  const color = score >= 80 
    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" 
    : score >= 60 
      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {Math.round(score)}
    </span>
  );
}

export function QuartixDriverScores() {
  const [dateRange, setDateRange] = useState("7");

  const { data: scores, isLoading } = useQuery({
    queryKey: ["quartix-driver-scores", dateRange],
    queryFn: async (): Promise<DriverScore[]> => {
      const fromDate = format(subDays(new Date(), parseInt(dateRange)), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("quartix_driver_scores")
        .select(`
          id, instructor_id, quartix_driver_id, score_date,
          overall_score, speed_score, acceleration_score,
          braking_score, cornering_score, fatigue_score
        `)
        .gte("score_date", fromDate)
        .order("overall_score", { ascending: false });

      if (error) throw error;

      // Fetch instructor names
      const instructorIds = [...new Set((data || []).map(s => s.instructor_id))];
      if (instructorIds.length === 0) return [];

      const { data: instructors } = await supabase
        .from("instructors")
        .select("id, name")
        .in("id", instructorIds);

      const nameMap: Record<string, string> = {};
      instructors?.forEach(i => { nameMap[i.id] = i.name; });

      return (data || []).map(s => ({
        ...s,
        instructor_name: nameMap[s.instructor_id] || "Unknown",
      }));
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Driver Scores (Quartix)
        </CardTitle>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !scores || scores.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No driver scores yet</p>
            <p className="text-sm mt-1">Scores will appear here once Quartix is connected and tracking</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Rank</th>
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Instructor</th>
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">Overall</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">Speed</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">Accel</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">Braking</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">Cornering</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">Fatigue</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((score, index) => (
                  <tr key={score.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      {index < 3 ? (
                        <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                          #{index + 1}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">#{index + 1}</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 font-medium">{score.instructor_name}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {format(new Date(score.score_date), "dd MMM")}
                    </td>
                    <td className="py-2 px-2 text-center"><ScoreBadge score={score.overall_score} /></td>
                    <td className="py-2 px-2 text-center"><ScoreBadge score={score.speed_score} /></td>
                    <td className="py-2 px-2 text-center"><ScoreBadge score={score.acceleration_score} /></td>
                    <td className="py-2 px-2 text-center"><ScoreBadge score={score.braking_score} /></td>
                    <td className="py-2 px-2 text-center"><ScoreBadge score={score.cornering_score} /></td>
                    <td className="py-2 px-2 text-center"><ScoreBadge score={score.fatigue_score} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
