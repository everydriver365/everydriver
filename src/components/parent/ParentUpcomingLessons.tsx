import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Clock, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isToday, isTomorrow } from "date-fns";

interface ParentUpcomingLessonsProps {
  childId: string;
}

interface UpcomingLesson {
  id: string;
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
  lesson_type: string;
  pickup_location: string | null;
  status: string;
}

export function ParentUpcomingLessons({ childId }: ParentUpcomingLessonsProps) {
  const [lessons, setLessons] = useState<UpcomingLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLessons();
  }, [childId]);

  const fetchLessons = async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const { data } = await supabase
      .from("scheduled_lessons")
      .select("id, lesson_date, start_time, duration_minutes, lesson_type, pickup_location, status")
      .eq("pupil_id", childId)
      .gte("lesson_date", today)
      .neq("status", "cancelled")
      .order("lesson_date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(8);
    setLessons(data || []);
    setLoading(false);
  };

  const formatTime = (t: string) => {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m}${hour >= 12 ? "pm" : "am"}`;
  };

  const getDayLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE d MMM");
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Upcoming Lessons
          {lessons.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-[10px]">
              {lessons.length} scheduled
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {lessons.length === 0 ? (
          <p className="text-muted-foreground text-center py-4 text-sm">
            No upcoming lessons scheduled
          </p>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson) => {
              const dayLabel = getDayLabel(lesson.lesson_date);
              const isNear = isToday(parseISO(lesson.lesson_date)) || isTomorrow(parseISO(lesson.lesson_date));
              return (
                <div
                  key={lesson.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${isNear ? "bg-primary/5 border-primary/20" : ""}`}
                >
                  <div className="text-center min-w-[60px]">
                    <div className={`text-xs font-bold ${isNear ? "text-primary" : "text-muted-foreground"}`}>
                      {dayLabel}
                    </div>
                    <div className="font-bold text-sm">{formatTime(lesson.start_time)}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground">{lesson.duration_minutes} mins</span>
                      <Badge variant="outline" className="text-[9px] h-4 ml-1">
                        {lesson.lesson_type || "Standard"}
                      </Badge>
                    </div>
                    {lesson.pickup_location && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">{lesson.pickup_location}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
