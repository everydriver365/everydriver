import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, GraduationCap, Clock, Trophy, Users, TrendingUp, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface PupilRow {
  id: string;
  name: string;
  instructor_id: string;
  lessons_completed: number | null;
  progress: number | null;
  test_passed: boolean | null;
  test_attempts: number | null;
  prepaid_hours: number | null;
  course_status: string | null;
  course_type: string | null;
  created_at: string;
}

interface LessonRow {
  pupil_id: string;
  instructor_id: string;
  duration_minutes: number | null;
  status: string | null;
}

interface InstructorRow {
  id: string;
  name: string;
}

interface InstructorStats {
  id: string;
  name: string;
  totalPupils: number;
  activePupils: number;
  completedPupils: number;
  passedPupils: number;
  avgProgress: number;
  avgHoursCompleted: number;
  passRate: number;
  firstAttemptPassRate: number;
}

interface Props {
  instructorIds: string[];
}

export default function SchoolPupilProgressSection({ instructorIds }: Props) {
  const [pupils, setPupils] = useState<PupilRow[]>([]);
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [instructors, setInstructors] = useState<InstructorRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (instructorIds.length === 0) { setLoading(false); return; }

    const fetchAll = async () => {
      setLoading(true);
      const [pupilRes, lessonRes, instrRes] = await Promise.all([
        supabase.from("pupils").select("id,name,instructor_id,lessons_completed,progress,test_passed,test_attempts,prepaid_hours,course_status,course_type,created_at").in("instructor_id", instructorIds).is("deleted_at", null),
        supabase.from("scheduled_lessons").select("pupil_id,instructor_id,duration_minutes,status").in("instructor_id", instructorIds).in("status", ["completed", "scheduled", "confirmed"]),
        supabase.from("instructors").select("id,name").in("id", instructorIds),
      ]);
      setPupils((pupilRes.data ?? []) as unknown as PupilRow[]);
      setLessons((lessonRes.data ?? []) as unknown as LessonRow[]);
      setInstructors((instrRes.data ?? []) as unknown as InstructorRow[]);
      setLoading(false);
    };
    fetchAll();
  }, [instructorIds]);

  // Hours per pupil from completed lessons
  const hoursByPupil = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of lessons) {
      if (l.status === "completed" && l.pupil_id) {
        map.set(l.pupil_id, (map.get(l.pupil_id) || 0) + (l.duration_minutes || 0) / 60);
      }
    }
    return map;
  }, [lessons]);

  // Aggregate stats
  const stats = useMemo(() => {
    const active = pupils.filter(p => p.course_status !== "completed" && p.course_status !== "cancelled");
    const completed = pupils.filter(p => p.course_status === "completed");
    const tested = pupils.filter(p => p.test_passed !== null);
    const passed = pupils.filter(p => p.test_passed === true);
    const firstAttemptPass = passed.filter(p => (p.test_attempts ?? 1) <= 1);
    const avgProgress = pupils.length > 0 ? Math.round(pupils.reduce((s, p) => s + (p.progress || 0), 0) / pupils.length) : 0;

    const allHours = Array.from(hoursByPupil.values());
    const avgHours = allHours.length > 0 ? allHours.reduce((a, b) => a + b, 0) / allHours.length : 0;

    // Hours-to-test: avg hours for pupils who passed
    const passedHours = passed.map(p => hoursByPupil.get(p.id) || 0).filter(h => h > 0);
    const avgHoursToTest = passedHours.length > 0 ? passedHours.reduce((a, b) => a + b, 0) / passedHours.length : 0;

    return {
      totalPupils: pupils.length,
      activePupils: active.length,
      completedPupils: completed.length,
      testedCount: tested.length,
      passedCount: passed.length,
      passRate: tested.length > 0 ? Math.round((passed.length / tested.length) * 100) : 0,
      firstAttemptPassRate: passed.length > 0 ? Math.round((firstAttemptPass.length / passed.length) * 100) : 0,
      avgProgress,
      avgHours: Math.round(avgHours * 10) / 10,
      avgHoursToTest: Math.round(avgHoursToTest * 10) / 10,
    };
  }, [pupils, hoursByPupil]);

  // Per-instructor breakdown
  const instructorStats = useMemo<InstructorStats[]>(() => {
    return instructors.map(inst => {
      const ip = pupils.filter(p => p.instructor_id === inst.id);
      const active = ip.filter(p => p.course_status !== "completed" && p.course_status !== "cancelled");
      const completed = ip.filter(p => p.course_status === "completed");
      const tested = ip.filter(p => p.test_passed !== null);
      const passed = ip.filter(p => p.test_passed === true);
      const firstPass = passed.filter(p => (p.test_attempts ?? 1) <= 1);
      const avgProg = ip.length > 0 ? Math.round(ip.reduce((s, p) => s + (p.progress || 0), 0) / ip.length) : 0;
      const hours = ip.map(p => hoursByPupil.get(p.id) || 0).filter(h => h > 0);
      const avgH = hours.length > 0 ? hours.reduce((a, b) => a + b, 0) / hours.length : 0;
      return {
        id: inst.id,
        name: inst.name,
        totalPupils: ip.length,
        activePupils: active.length,
        completedPupils: completed.length,
        passedPupils: passed.length,
        avgProgress: avgProg,
        avgHoursCompleted: Math.round(avgH * 10) / 10,
        passRate: tested.length > 0 ? Math.round((passed.length / tested.length) * 100) : 0,
        firstAttemptPassRate: passed.length > 0 ? Math.round((firstPass.length / passed.length) * 100) : 0,
      };
    }).sort((a, b) => b.passRate - a.passRate);
  }, [instructors, pupils, hoursByPupil]);

  // Progress distribution buckets
  const progressBuckets = useMemo(() => {
    const buckets = [
      { label: "0-25%", count: 0, color: "bg-destructive" },
      { label: "26-50%", count: 0, color: "bg-orange-500" },
      { label: "51-75%", count: 0, color: "bg-yellow-500" },
      { label: "76-100%", count: 0, color: "bg-green-500" },
    ];
    for (const p of pupils) {
      const prog = p.progress || 0;
      if (prog <= 25) buckets[0].count++;
      else if (prog <= 50) buckets[1].count++;
      else if (prog <= 75) buckets[2].count++;
      else buckets[3].count++;
    }
    return buckets;
  }, [pupils]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Pupil Progress</h2>
        <p className="text-muted-foreground">Lesson completion, hours-to-test, and pass rates across all instructors</p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard icon={Users} label="Total Pupils" value={stats.totalPupils} />
        <KPICard icon={GraduationCap} label="Active" value={stats.activePupils} />
        <KPICard icon={TrendingUp} label="Avg Progress" value={`${stats.avgProgress}%`} />
        <KPICard icon={Clock} label="Avg Hours" value={stats.avgHours} />
        <KPICard icon={Clock} label="Hours to Test" value={stats.avgHoursToTest} subtitle="(passed pupils)" />
        <KPICard icon={Trophy} label="Pass Rate" value={`${stats.passRate}%`} subtitle={`${stats.passedCount}/${stats.testedCount} tested`} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Progress Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Progress Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {progressBuckets.map(b => (
              <div key={b.label} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-16">{b.label}</span>
                <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${b.color} rounded-full transition-all`}
                    style={{ width: pupils.length > 0 ? `${(b.count / pupils.length) * 100}%` : "0%" }}
                  />
                </div>
                <span className="text-sm font-medium w-8 text-right">{b.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pass Rate Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4" /> Pass Rate Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overall Pass Rate</span>
              <div className="flex items-center gap-2">
                <Progress value={stats.passRate} className="w-24 h-2" />
                <span className="text-sm font-semibold w-10 text-right">{stats.passRate}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">1st Attempt Pass Rate</span>
              <div className="flex items-center gap-2">
                <Progress value={stats.firstAttemptPassRate} className="w-24 h-2" />
                <span className="text-sm font-semibold w-10 text-right">{stats.firstAttemptPassRate}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pupils Tested</span>
              <span className="text-sm font-semibold">{stats.testedCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pupils Passed</span>
              <span className="text-sm font-semibold text-green-600">{stats.passedCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Completed Course</span>
              <span className="text-sm font-semibold">{stats.completedPupils}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-Instructor Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Instructor Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 pr-4 font-medium">Instructor</th>
                  <th className="text-center py-2 px-2 font-medium">Pupils</th>
                  <th className="text-center py-2 px-2 font-medium">Active</th>
                  <th className="text-center py-2 px-2 font-medium">Avg Progress</th>
                  <th className="text-center py-2 px-2 font-medium">Avg Hours</th>
                  <th className="text-center py-2 px-2 font-medium">Passed</th>
                  <th className="text-center py-2 px-2 font-medium">Pass Rate</th>
                  <th className="text-center py-2 px-2 font-medium">1st Attempt</th>
                </tr>
              </thead>
              <tbody>
                {instructorStats.map(inst => (
                  <tr key={inst.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2.5 pr-4 font-medium">{inst.name}</td>
                    <td className="py-2.5 px-2 text-center">{inst.totalPupils}</td>
                    <td className="py-2.5 px-2 text-center">{inst.activePupils}</td>
                    <td className="py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Progress value={inst.avgProgress} className="w-12 h-1.5" />
                        <span>{inst.avgProgress}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center">{inst.avgHoursCompleted}</td>
                    <td className="py-2.5 px-2 text-center">{inst.passedPupils}</td>
                    <td className="py-2.5 px-2 text-center">
                      <Badge variant={inst.passRate >= 70 ? "default" : inst.passRate >= 50 ? "secondary" : "destructive"} className="text-xs">
                        {inst.passRate}%
                      </Badge>
                    </td>
                    <td className="py-2.5 px-2 text-center">{inst.firstAttemptPassRate}%</td>
                  </tr>
                ))}
                {instructorStats.length === 0 && (
                  <tr><td colSpan={8} className="text-center text-muted-foreground py-8">No instructor data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, subtitle }: { icon: typeof Users; label: string; value: string | number; subtitle?: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Icon className="h-4 w-4" />
          <span className="text-xs font-medium">{label}</span>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
