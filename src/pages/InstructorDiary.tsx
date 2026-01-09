import { useState, useEffect } from "react";
import { BookOpen, Calendar, Clock, Star } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

const MOCK_INSTRUCTOR_ID = "b7987d5e-348f-4047-a8d4-ee71fab1f01d";

interface LessonRecord {
  id: string;
  lesson_date: string;
  start_time: string | null;
  duration_minutes: number;
  notes: string | null;
  rating: number | null;
  skills_practiced: string[] | null;
  pupils: { name: string } | null;
}

interface LessonStat {
  totalLessons: number;
  totalHours: number;
  uniquePupils: number;
}

export default function InstructorDiary() {
  const [stats, setStats] = useState<LessonStat>({ totalLessons: 0, totalHours: 0, uniquePupils: 0 });
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
      
      // Fetch lessons with pupil names
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lesson_history")
        .select("id, lesson_date, start_time, duration_minutes, notes, rating, skills_practiced, pupils(name)")
        .eq("instructor_id", MOCK_INSTRUCTOR_ID)
        .order("lesson_date", { ascending: false })
        .limit(30);

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);

      // Calculate stats
      const { data: statsData } = await supabase
        .from("lesson_history")
        .select("duration_minutes, pupil_id")
        .eq("instructor_id", MOCK_INSTRUCTOR_ID)
        .gte("lesson_date", thirtyDaysAgo);

      const totalLessons = statsData?.length || 0;
      const totalHours = Math.round((statsData?.reduce((sum, l) => sum + l.duration_minutes, 0) || 0) / 60);
      const uniquePupils = new Set(statsData?.map(l => l.pupil_id)).size;

      setStats({ totalLessons, totalHours, uniquePupils });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="px-3 md:container py-4 pb-24 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Lesson Diary
          </h1>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalLessons}</div>
              <div className="text-xs text-muted-foreground">Lessons (30d)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalHours}</div>
              <div className="text-xs text-muted-foreground">Hours (30d)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-primary">{stats.uniquePupils}</div>
              <div className="text-xs text-muted-foreground">Pupils</div>
            </CardContent>
          </Card>
        </div>

        {/* Lesson History */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Lessons</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : lessons.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No lessons logged yet
              </p>
            ) : (
              <div className="space-y-3">
                {lessons.map((lesson) => (
                  <div key={lesson.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{lesson.pupils?.name || "Unknown Pupil"}</span>
                      <Badge variant="secondary">{lesson.duration_minutes / 60}h</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(lesson.lesson_date), "MMM d")}
                      </span>
                      {lesson.start_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {lesson.start_time.slice(0, 5)}
                        </span>
                      )}
                      {lesson.rating && (
                        <span className="flex items-center gap-0.5">
                          {[...Array(lesson.rating)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                          ))}
                        </span>
                      )}
                    </div>
                    {lesson.notes && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{lesson.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <InstructorBottomNav />
    </MainLayout>
  );
}
