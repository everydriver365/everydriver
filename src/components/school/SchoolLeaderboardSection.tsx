import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trophy, Star } from "lucide-react";
import { useSchoolDemo } from "@/context/SchoolDemoContext";

interface Props {
  instructorIds: string[];
}

interface InstructorStat {
  id: string;
  name: string;
  totalLessons: number;
  totalRevenue: number;
  avgRating: number | null;
}

export default function SchoolLeaderboardSection({ instructorIds }: Props) {
  const { isDemo } = useSchoolDemo();
  const [stats, setStats] = useState<InstructorStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      setStats([
        { id: "1", name: "John Smith", totalLessons: 142, totalRevenue: 5680, avgRating: 4.8 },
        { id: "2", name: "Sarah Jones", totalLessons: 118, totalRevenue: 4720, avgRating: 4.9 },
        { id: "3", name: "Mike Taylor", totalLessons: 95, totalRevenue: 3800, avgRating: 4.6 },
      ]);
      setLoading(false);
      return;
    }
    if (!instructorIds.length) { setLoading(false); return; }
    const fetch = async () => {
      const { data: instructors } = await supabase
        .from("instructors")
        .select("id, name")
        .in("id", instructorIds);

      const { data: lessons } = await supabase
        .from("scheduled_lessons")
        .select("instructor_id")
        .in("instructor_id", instructorIds)
        .eq("status", "completed");

      const { data: payments } = await supabase
        .from("payment_history")
        .select("instructor_id, amount")
        .in("instructor_id", instructorIds);

      const lessonCounts: Record<string, number> = {};
      (lessons || []).forEach((l: any) => { lessonCounts[l.instructor_id] = (lessonCounts[l.instructor_id] || 0) + 1; });

      const revenueTotals: Record<string, number> = {};
      (payments || []).forEach((p: any) => { revenueTotals[p.instructor_id] = (revenueTotals[p.instructor_id] || 0) + (p.amount || 0); });

      const result = (instructors || []).map((i: any) => ({
        id: i.id,
        name: i.name,
        totalLessons: lessonCounts[i.id] || 0,
        totalRevenue: revenueTotals[i.id] || 0,
        avgRating: null,
      }));

      result.sort((a, b) => b.totalLessons - a.totalLessons);
      setStats(result);
      setLoading(false);
    };
    fetch();
  }, [instructorIds, isDemo]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Instructor Leaderboard</h2>
        <p className="text-muted-foreground">Performance rankings within your school</p>
      </div>
      {stats.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No data available</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {stats.map((s, idx) => (
            <Card key={s.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <span className="text-2xl w-8 text-center">{medals[idx] || `#${idx + 1}`}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{s.name}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{s.totalLessons} lessons</span>
                    <span>£{s.totalRevenue.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</span>
                    {s.avgRating && <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{s.avgRating}</span>}
                  </div>
                </div>
                <Trophy className="h-5 w-5 text-primary/30" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
