import { useState, useEffect } from "react";
import { Trophy, Fuel, Timer, ShieldCheck, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardEntry {
  id: string;
  name: string;
  profileImage: string | null;
  value: number;
  label: string;
  secondary?: string;
}

export function InstructorLeaderboard() {
  const [lessonsLeaders, setLessonsLeaders] = useState<LeaderboardEntry[]>([]);
  const [passRateLeaders, setPassRateLeaders] = useState<LeaderboardEntry[]>([]);
  const [pupilCountLeaders, setPupilCountLeaders] = useState<LeaderboardEntry[]>([]);
  const [reviewLeaders, setReviewLeaders] = useState<LeaderboardEntry[]>([]);
  const [drivingScoreLeaders, setDrivingScoreLeaders] = useState<LeaderboardEntry[]>([]);
  const [fuelLeaders, setFuelLeaders] = useState<LeaderboardEntry[]>([]);
  const [idleLeaders, setIdleLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const monthStr = startOfMonth.toISOString().split("T")[0];

      // 30 days ago for telematics data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysStr = thirtyDaysAgo.toISOString().split("T")[0];

      const { data: instructors } = await supabase
        .from("instructors")
        .select("id, name, profile_image_url")
        .eq("is_active", true)
        .eq("is_network_placeholder", false);

      if (!instructors?.length) {
        setLoading(false);
        return;
      }

      const instructorMap = new Map(instructors.map((i) => [i.id, i]));

      // Parallel data fetches
      const [lessonsRes, pupilsRes, testsRes, reviewsRes, timesheetsRes, behaviorRes] =
        await Promise.all([
          supabase
            .from("scheduled_lessons")
            .select("instructor_id")
            .gte("lesson_date", monthStr)
            .neq("status", "cancelled"),
          supabase
            .from("pupils")
            .select("instructor_id")
            .in("status", ["active"]),
          supabase
            .from("driving_test_results")
            .select("instructor_id, result")
            .eq("is_mock", false),
          supabase
            .from("course_reviews")
            .select("instructor_id, rating")
            .eq("moderation_status", "approved"),
          supabase
            .from("driver_timesheets")
            .select("instructor_id, total_distance_km, total_driving_minutes, total_idle_minutes")
            .gte("sheet_date", thirtyDaysStr),
          supabase
            .from("driving_behavior_events")
            .select("telematics_id, event_type, severity")
            .gte("recorded_at", thirtyDaysAgo.toISOString()),
        ]);

      // --- Lessons ---
      const lessonCounts: Record<string, number> = {};
      (lessonsRes.data || []).forEach((l) => {
        lessonCounts[l.instructor_id] = (lessonCounts[l.instructor_id] || 0) + 1;
      });
      setLessonsLeaders(
        instructors
          .map((i) => ({
            id: i.id,
            name: i.name,
            profileImage: i.profile_image_url,
            value: lessonCounts[i.id] || 0,
            label: "lessons",
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10)
      );

      // --- Pupils ---
      const pupilCounts: Record<string, number> = {};
      (pupilsRes.data || []).forEach((p) => {
        pupilCounts[p.instructor_id] = (pupilCounts[p.instructor_id] || 0) + 1;
      });
      setPupilCountLeaders(
        instructors
          .map((i) => ({
            id: i.id,
            name: i.name,
            profileImage: i.profile_image_url,
            value: pupilCounts[i.id] || 0,
            label: "pupils",
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10)
      );

      // --- Pass Rate ---
      const testData: Record<string, { pass: number; total: number }> = {};
      (testsRes.data || []).forEach((t) => {
        if (!testData[t.instructor_id]) testData[t.instructor_id] = { pass: 0, total: 0 };
        testData[t.instructor_id].total++;
        if (t.result === "pass") testData[t.instructor_id].pass++;
      });
      setPassRateLeaders(
        instructors
          .filter((i) => testData[i.id]?.total >= 3)
          .map((i) => ({
            id: i.id,
            name: i.name,
            profileImage: i.profile_image_url,
            value: Math.round((testData[i.id].pass / testData[i.id].total) * 100),
            label: "%",
            secondary: `${testData[i.id].pass}/${testData[i.id].total} tests`,
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10)
      );

      // --- Reviews ---
      const reviewData: Record<string, { sum: number; count: number }> = {};
      (reviewsRes.data || []).forEach((r) => {
        if (!reviewData[r.instructor_id]) reviewData[r.instructor_id] = { sum: 0, count: 0 };
        reviewData[r.instructor_id].sum += r.rating;
        reviewData[r.instructor_id].count++;
      });
      setReviewLeaders(
        instructors
          .filter((i) => reviewData[i.id]?.count >= 2)
          .map((i) => ({
            id: i.id,
            name: i.name,
            profileImage: i.profile_image_url,
            value: parseFloat((reviewData[i.id].sum / reviewData[i.id].count).toFixed(1)),
            label: "★",
            secondary: `${reviewData[i.id].count} reviews`,
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10)
      );

      // --- Driver Timesheets aggregation (fuel efficiency + idle time) ---
      const timesheetAgg: Record<
        string,
        { totalKm: number; totalDrivingMin: number; totalIdleMin: number; days: number }
      > = {};
      (timesheetsRes.data || []).forEach((t) => {
        if (!timesheetAgg[t.instructor_id]) {
          timesheetAgg[t.instructor_id] = { totalKm: 0, totalDrivingMin: 0, totalIdleMin: 0, days: 0 };
        }
        const a = timesheetAgg[t.instructor_id];
        a.totalKm += t.total_distance_km || 0;
        a.totalDrivingMin += t.total_driving_minutes || 0;
        a.totalIdleMin += t.total_idle_minutes || 0;
        a.days++;
      });

      // Fuel efficiency: miles per hour of driving (higher = better)
      setFuelLeaders(
        instructors
          .filter((i) => timesheetAgg[i.id]?.totalDrivingMin >= 60) // min 1 hour data
          .map((i) => {
            const a = timesheetAgg[i.id];
            const miles = a.totalKm * 0.621371;
            const hours = a.totalDrivingMin / 60;
            const mph = Math.round((miles / hours) * 10) / 10;
            return {
              id: i.id,
              name: i.name,
              profileImage: i.profile_image_url,
              value: mph,
              label: "mph avg",
              secondary: `${Math.round(miles).toLocaleString()} mi / ${a.days} days`,
            };
          })
          .sort((a, b) => b.value - a.value)
          .slice(0, 10)
      );

      // Idle time: idle % of total time (lower = better, so sort ascending)
      setIdleLeaders(
        instructors
          .filter((i) => timesheetAgg[i.id]?.totalDrivingMin >= 60)
          .map((i) => {
            const a = timesheetAgg[i.id];
            const totalMin = a.totalDrivingMin + a.totalIdleMin;
            const idlePct = totalMin > 0 ? Math.round((a.totalIdleMin / totalMin) * 100) : 0;
            return {
              id: i.id,
              name: i.name,
              profileImage: i.profile_image_url,
              value: idlePct,
              label: "% idle",
              secondary: `${Math.round(a.totalIdleMin)} min idle / ${a.days} days`,
            };
          })
          .sort((a, b) => a.value - b.value) // Lower idle % is better
          .slice(0, 10)
      );

      // --- Driving Score: based on behavior events per 100 miles (lower = better) ---
      // First get telematics sessions to map events to instructors
      const telematicsIds = [
        ...new Set((behaviorRes.data || []).map((e) => e.telematics_id)),
      ];

      let eventsByInstructor: Record<string, { total: number; high: number }> = {};

      if (telematicsIds.length > 0) {
        // Fetch in batches if needed
        const batchSize = 200;
        const instructorForSession: Record<string, string> = {};

        for (let i = 0; i < telematicsIds.length; i += batchSize) {
          const batch = telematicsIds.slice(i, i + batchSize);
          const { data: sessions } = await supabase
            .from("lesson_telematics")
            .select("id, instructor_id")
            .in("id", batch);

          (sessions || []).forEach((s) => {
            instructorForSession[s.id] = s.instructor_id;
          });
        }

        (behaviorRes.data || []).forEach((e) => {
          const instrId = instructorForSession[e.telematics_id];
          if (!instrId) return;
          if (!eventsByInstructor[instrId]) eventsByInstructor[instrId] = { total: 0, high: 0 };
          eventsByInstructor[instrId].total++;
          if (e.severity === "high") eventsByInstructor[instrId].high++;
        });
      }

      // Score: 100 - (events per 100 miles * penalty weight)
      setDrivingScoreLeaders(
        instructors
          .filter((i) => timesheetAgg[i.id]?.totalKm >= 50) // min 50km data
          .map((i) => {
            const miles = (timesheetAgg[i.id]?.totalKm || 1) * 0.621371;
            const events = eventsByInstructor[i.id] || { total: 0, high: 0 };
            const eventsPer100Mi = (events.total / miles) * 100;
            // Score: 100 minus weighted events (high severity counts double)
            const rawScore = 100 - (eventsPer100Mi * 3 + (events.high / miles) * 100 * 2);
            const score = Math.max(0, Math.min(100, Math.round(rawScore)));
            return {
              id: i.id,
              name: i.name,
              profileImage: i.profile_image_url,
              value: score,
              label: "/ 100",
              secondary: `${events.total} events over ${Math.round(miles)} mi`,
            };
          })
          .sort((a, b) => b.value - a.value)
          .slice(0, 10)
      );
    } catch (err) {
      console.error("Leaderboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getMedalColor = (index: number) => {
    if (index === 0) return "text-amber-500";
    if (index === 1) return "text-gray-400";
    if (index === 2) return "text-amber-700";
    return "text-muted-foreground";
  };

  const renderList = (entries: LeaderboardEntry[], options?: { invertBar?: boolean }) => (
    <div className="space-y-1.5 pt-2">
      {entries.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">
          No data available yet
        </p>
      )}
      {entries.map((entry, i) => {
        const maxVal = Math.max(...entries.map((e) => e.value), 1);
        const barPct = options?.invertBar
          ? ((maxVal - entry.value) / maxVal) * 100
          : (entry.value / maxVal) * 100;

        return (
          <div
            key={entry.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <span className={`text-base font-bold w-6 text-center ${getMedalColor(i)}`}>
              {i < 3 ? ["🥇", "🥈", "🥉"][i] : `${i + 1}`}
            </span>
            <Avatar className="h-8 w-8">
              <AvatarImage src={entry.profileImage || undefined} />
              <AvatarFallback className="text-xs bg-muted">
                {entry.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate">{entry.name}</span>
                <Badge variant="secondary" className="text-xs shrink-0 tabular-nums">
                  {entry.value} {entry.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={barPct} className="h-1.5 flex-1" />
                {entry.secondary && (
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {entry.secondary}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Instructor Leaderboard
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ranking across performance, driving, and efficiency metrics
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="driving-score">
          <div className="overflow-x-auto -mx-1 px-1">
            <TabsList className="inline-flex w-auto min-w-full gap-0.5">
              <TabsTrigger value="driving-score" className="text-xs gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Drive Score
              </TabsTrigger>
              <TabsTrigger value="fuel" className="text-xs gap-1">
                <Fuel className="h-3.5 w-3.5" />
                Efficiency
              </TabsTrigger>
              <TabsTrigger value="idle" className="text-xs gap-1">
                <Timer className="h-3.5 w-3.5" />
                Idle Time
              </TabsTrigger>
              <TabsTrigger value="lessons" className="text-xs">
                Lessons
              </TabsTrigger>
              <TabsTrigger value="passrate" className="text-xs">
                Pass Rate
              </TabsTrigger>
              <TabsTrigger value="reviews" className="text-xs">
                Reviews
              </TabsTrigger>
              <TabsTrigger value="pupils" className="text-xs">
                Pupils
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="driving-score">
            <p className="text-xs text-muted-foreground mt-2 mb-1">
              Score based on harsh events per 100 miles (last 30 days)
            </p>
            {renderList(drivingScoreLeaders)}
          </TabsContent>
          <TabsContent value="fuel">
            <p className="text-xs text-muted-foreground mt-2 mb-1">
              Average speed efficiency — miles covered per hour driving (last 30 days)
            </p>
            {renderList(fuelLeaders)}
          </TabsContent>
          <TabsContent value="idle">
            <p className="text-xs text-muted-foreground mt-2 mb-1">
              Idle time as % of total engine-on time — lower is better (last 30 days)
            </p>
            {renderList(idleLeaders, { invertBar: true })}
          </TabsContent>
          <TabsContent value="lessons">{renderList(lessonsLeaders)}</TabsContent>
          <TabsContent value="passrate">{renderList(passRateLeaders)}</TabsContent>
          <TabsContent value="reviews">{renderList(reviewLeaders)}</TabsContent>
          <TabsContent value="pupils">{renderList(pupilCountLeaders)}</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
