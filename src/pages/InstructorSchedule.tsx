import { useState, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";
import { TodayScheduleView } from "@/components/instructor/TodayScheduleView";
import { TomorrowScheduleView } from "@/components/instructor/TomorrowScheduleView";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";

const MOCK_INSTRUCTOR_ID = "b7987d5e-348f-4047-a8d4-ee71fab1f01d";

interface ScheduledLesson {
  id: string;
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
  status: string;
  pupils: { name: string } | null;
}

export default function InstructorSchedule() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [weekLessons, setWeekLessons] = useState<ScheduledLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeekLessons();
  }, [currentWeekStart]);

  const fetchWeekLessons = async () => {
    setLoading(true);
    try {
      const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
      const { data, error } = await supabase
        .from("scheduled_lessons")
        .select("id, lesson_date, start_time, duration_minutes, status, pupils(name)")
        .eq("instructor_id", MOCK_INSTRUCTOR_ID)
        .gte("lesson_date", format(currentWeekStart, "yyyy-MM-dd"))
        .lte("lesson_date", format(weekEnd, "yyyy-MM-dd"))
        .neq("status", "cancelled")
        .order("lesson_date")
        .order("start_time");

      if (error) throw error;
      setWeekLessons(data || []);
    } catch (error) {
      console.error("Error fetching week lessons:", error);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousWeek = () => setCurrentWeekStart(addDays(currentWeekStart, -7));
  const goToNextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
  const goToCurrentWeek = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const getLessonsForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return weekLessons.filter(lesson => lesson.lesson_date === dateStr);
  };

  return (
    <MainLayout>
      <div className="container py-4 pb-24 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Schedule
          </h1>
          <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
            Today
          </Button>
        </div>

        {/* Week Navigation */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-base">
                {format(currentWeekStart, "MMM d")} - {format(addDays(currentWeekStart, 6), "MMM d, yyyy")}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : (
              <div className="space-y-3">
                {weekDays.map((day) => {
                  const lessons = getLessonsForDay(day);
                  const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                  return (
                    <div
                      key={day.toISOString()}
                      className={`p-3 rounded-lg border ${isToday ? "border-primary bg-primary/5" : "border-border"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium ${isToday ? "text-primary" : ""}`}>
                          {format(day, "EEE, MMM d")}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
                        </span>
                      </div>
                      {lessons.length > 0 ? (
                        <div className="space-y-1">
                          {lessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className="text-sm bg-muted/50 rounded px-2 py-1 flex justify-between"
                            >
                              <span>{lesson.start_time.slice(0, 5)} - {lesson.pupils?.name || "Unknown"}</span>
                              <span className="text-muted-foreground">{lesson.duration_minutes}min</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No lessons scheduled</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <InstructorBottomNav />
    </MainLayout>
  );
}
