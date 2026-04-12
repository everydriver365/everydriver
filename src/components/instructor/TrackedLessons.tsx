import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { subDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Play, Route, Clock, Gauge, Users, ChevronRight } from "lucide-react";

interface TrackedLessonsProps {
  instructorId: string;
  compact?: boolean;
  limit?: number;
}

interface TrackedLesson {
  id: string;
  started_at: string | null;
  ended_at: string | null;
  total_distance_km: number | null;
  avg_speed_kmh: number | null;
  max_speed_kmh: number | null;
  local_score: number | null;
  harsh_brake_count: number | null;
  speeding_events_count: number | null;
  pupil_name: string | null;
  pupil_id: string | null;
}

const kmToMiles = (km: number) => +(km * 0.621371).toFixed(1);
const kmhToMph = (kmh: number) => Math.round(kmh * 0.621371);

function getScoreColor(score: number | null): string {
  if (!score) return "text-muted-foreground";
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function getDuration(start: string | null, end: string | null): string {
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function TrackedLessons({ instructorId, compact = false, limit = 50 }: TrackedLessonsProps) {
  const [lessons, setLessons] = useState<TrackedLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"7" | "14" | "30">("7");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchLessons() {
      setLoading(true);
      const fromDate = subDays(new Date(), parseInt(range)).toISOString();

      const { data, error } = await supabase
        .from("lesson_telematics")
        .select("id, started_at, ended_at, total_distance_km, avg_speed_kmh, max_speed_kmh, local_score, harsh_brake_count, speeding_events_count, pupil_id")
        .eq("instructor_id", instructorId)
        .not("ended_at", "is", null)
        .gte("started_at", fromDate)
        .order("started_at", { ascending: false })
        .limit(limit);

      if (data) {
        // Fetch pupil names separately (no FK join available)
        const pupilIds = [...new Set(data.map((d: any) => d.pupil_id).filter(Boolean))];
        let pupilMap: Record<string, string> = {};
        if (pupilIds.length > 0) {
          const { data: pupils } = await supabase
            .from("pupils")
            .select("id, name")
            .in("id", pupilIds);
          if (pupils) {
            pupilMap = Object.fromEntries(pupils.map(p => [p.id, p.name]));
          }
        }

        setLessons(data.map((d: any) => ({
          ...d,
          pupil_name: d.pupil_id ? (pupilMap[d.pupil_id] || null) : null,
        })));
      }
      setLoading(false);
    }
    fetchLessons();
  }, [instructorId, range, limit]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-6 w-40 mb-3" />
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 mb-2" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Play className="h-4 w-4 text-primary" />
            {compact ? "Recent Tracked Lessons" : "Tracked Lessons"}
          </CardTitle>
          {!compact && (
            <Select value={range} onValueChange={(v) => setRange(v as "7" | "14" | "30")}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border z-50">
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        {lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No tracked lessons in this period</p>
        ) : (
          <div className="space-y-2">
            {lessons.map(lesson => (
              <div
                key={lesson.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl hover:bg-muted/50 transition-colors cursor-pointer group"
                onClick={() => navigate(`/instructor/trip-replay/${lesson.id}`)}
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    {lesson.pupil_name ? (
                      <span className="text-sm font-medium flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        {lesson.pupil_name}
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">Solo Drive</span>
                    )}
                    {lesson.local_score != null && (
                      <Badge variant="secondary" className={`text-[10px] ${getScoreColor(lesson.local_score)}`}>
                        {lesson.local_score}/100
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {lesson.started_at && (
                      <span>{format(new Date(lesson.started_at), "dd MMM · HH:mm")}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getDuration(lesson.started_at, lesson.ended_at)}
                    </span>
                    {lesson.total_distance_km != null && lesson.total_distance_km > 0 && (
                      <span className="flex items-center gap-1">
                        <Route className="h-3 w-3" />
                        {kmToMiles(lesson.total_distance_km)} mi
                      </span>
                    )}
                    {lesson.max_speed_kmh != null && lesson.max_speed_kmh > 0 && (
                      <span className="flex items-center gap-1">
                        <Gauge className="h-3 w-3" />
                        {kmhToMph(lesson.max_speed_kmh)} mph max
                      </span>
                    )}
                  </div>

                  {!compact && (lesson.harsh_brake_count || lesson.speeding_events_count) ? (
                    <div className="flex items-center gap-2 text-[10px]">
                      {(lesson.harsh_brake_count ?? 0) > 0 && (
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                          {lesson.harsh_brake_count} harsh brakes
                        </Badge>
                      )}
                      {(lesson.speeding_events_count ?? 0) > 0 && (
                        <Badge variant="outline" className="text-[10px] text-red-600 border-red-300">
                          {lesson.speeding_events_count} speeding
                        </Badge>
                      )}
                    </div>
                  ) : null}
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0 ml-2" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
