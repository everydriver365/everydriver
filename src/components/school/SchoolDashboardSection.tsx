import { useState, useEffect } from "react";
import { Calendar, TrendingUp, Users, Award, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  instructorIds: string[];
  schoolName: string;
}

export default function SchoolDashboardSection({ instructorIds, schoolName }: Props) {
  const [stats, setStats] = useState({ totalLessons: 0, totalEarnings: 0, totalPupils: 0, passRate: 0, upcomingLessons: 0, activeInstructors: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (instructorIds.length === 0) { setLoading(false); return; }
    fetchStats();
  }, [instructorIds]);

  const fetchStats = async () => {
    const [lessonsRes, pupilsRes, testsRes, upcomingRes] = await Promise.all([
      supabase.from("scheduled_lessons").select("amount_due, status").in("instructor_id", instructorIds),
      supabase.from("pupils").select("id").in("instructor_id", instructorIds).is("deleted_at", null),
      supabase.from("driving_test_results").select("result").in("instructor_id", instructorIds),
      supabase.from("scheduled_lessons").select("id, start_time, pupils(name)").in("instructor_id", instructorIds).eq("status", "scheduled").gte("start_time", new Date().toISOString()).order("start_time", { ascending: true }).limit(5),
    ]);

    const completed = (lessonsRes.data || []).filter(l => l.status === "completed");
    const passed = (testsRes.data || []).filter(t => t.result === "pass").length;
    const total = (testsRes.data || []).length;

    setStats({
      totalLessons: completed.length,
      totalEarnings: completed.reduce((s, l) => s + (l.amount_due || 0), 0),
      totalPupils: (pupilsRes.data || []).length,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      upcomingLessons: (upcomingRes.data || []).length,
      activeInstructors: instructorIds.length,
    });

    setRecentActivity((upcomingRes.data || []).slice(0, 5));
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Clock className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{schoolName}</h2>
        <p className="text-muted-foreground">School overview and key metrics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { icon: Users, label: "Active Instructors", value: stats.activeInstructors, color: "text-primary" },
          { icon: Users, label: "Total Pupils", value: stats.totalPupils, color: "text-sky-500" },
          { icon: Calendar, label: "Lessons Completed", value: stats.totalLessons, color: "text-primary" },
          { icon: TrendingUp, label: "Total Earnings", value: `£${stats.totalEarnings.toLocaleString()}`, color: "text-emerald-500" },
          { icon: Award, label: "Pass Rate", value: `${stats.passRate}%`, color: "text-amber-500" },
          { icon: Clock, label: "Upcoming Lessons", value: stats.upcomingLessons, color: "text-violet-500" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="pt-4 text-center">
              <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {recentActivity.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Upcoming Lessons</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recentActivity.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between p-2 rounded-lg border text-sm">
                <span className="font-medium">{(a as any).pupils?.name || "Student"}</span>
                <Badge variant="outline" className="text-xs">{new Date(a.start_time).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
