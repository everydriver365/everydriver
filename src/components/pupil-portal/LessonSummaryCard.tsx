import { useState, useEffect } from "react";
import { Clock, Calendar, MapPin, Star, BookOpen, PoundSterling } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";

interface LessonSummaryCardProps {
  pupilId: string;
}

interface RecentLesson {
  id: string;
  lesson_date: string;
  start_time: string | null;
  duration_minutes: number;
  notes: string | null;
  skills_practiced: string[] | null;
}

export function LessonSummaryCard({ pupilId }: LessonSummaryCardProps) {
  const [lesson, setLesson] = useState<RecentLesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const { data } = await supabase
          .from("lesson_history")
          .select("id, lesson_date, start_time, duration_minutes, notes, skills_practiced")
          .eq("pupil_id", pupilId)
          .order("lesson_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        setLesson(data);
      } catch (e) {
        console.error("Error fetching latest lesson:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, [pupilId]);

  if (loading || !lesson) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          Last Lesson Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{format(parseISO(lesson.lesson_date), "EEE, d MMM")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{lesson.duration_minutes} mins</span>
          </div>
        </div>

        {lesson.skills_practiced && lesson.skills_practiced.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {lesson.skills_practiced.map((skill, i) => (
              <Badge key={i} variant="secondary" className="text-[10px]">
                {skill}
              </Badge>
            ))}
          </div>
        )}

        {lesson.notes && (
          <p className="text-xs text-muted-foreground italic line-clamp-2">
            "{lesson.notes}"
          </p>
        )}
      </CardContent>
    </Card>
  );
}
