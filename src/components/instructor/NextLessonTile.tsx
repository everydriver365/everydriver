import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, MapPin, ChevronRight } from "lucide-react";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { PupilAvatar } from "./PupilAvatar";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NextLessonTileProps {
  instructorId: string;
}

interface NextLesson {
  id: string;
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
  pupil: {
    id: string;
    name: string;
    postcode: string;
    profile_image_url: string | null;
  };
}

export function NextLessonTile({ instructorId }: NextLessonTileProps) {
  const { data: nextLesson, isLoading } = useQuery({
    queryKey: ["next-lesson-tile", instructorId],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const now = format(new Date(), "HH:mm:ss");

      const { data, error } = await supabase
        .from("scheduled_lessons")
        .select(`
          id,
          lesson_date,
          start_time,
          duration_minutes,
          pupils!inner (
            id,
            name,
            postcode,
            profile_image_url
          )
        `)
        .eq("instructor_id", instructorId)
        .gte("lesson_date", today)
        .order("lesson_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(10);

      if (error) throw error;

      // Filter to get the next upcoming lesson (not already started)
      const upcoming = (data || []).find((lesson: any) => {
        if (lesson.lesson_date > today) return true;
        if (lesson.lesson_date === today && lesson.start_time >= now) return true;
        return false;
      });

      if (!upcoming) return null;

      return {
        id: upcoming.id,
        lesson_date: upcoming.lesson_date,
        start_time: upcoming.start_time,
        duration_minutes: upcoming.duration_minutes,
        pupil: upcoming.pupils,
      } as NextLesson;
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border p-4 animate-pulse">
        <div className="h-16 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!nextLesson) {
    return null;
  }

  const lessonDate = parseISO(nextLesson.lesson_date);
  const isLessonToday = isToday(lessonDate);
  const isLessonTomorrow = isTomorrow(lessonDate);

  const getDateLabel = () => {
    if (isLessonToday) return "Today";
    if (isLessonTomorrow) return "Tomorrow";
    return format(lessonDate, "EEE, d MMM");
  };

  const getTimeLabel = () => {
    return nextLesson.start_time.slice(0, 5);
  };

  return (
    <Link
      to={`/instructor/schedule?date=${nextLesson.lesson_date}`}
      className="block"
    >
      <div className={cn(
        "bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-4",
        "hover:from-primary/15 hover:to-primary/10 transition-colors"
      )}>
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <PupilAvatar
            name={nextLesson.pupil.name}
            imageUrl={nextLesson.pupil.profile_image_url}
            size="lg"
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-primary font-medium uppercase tracking-wide mb-0.5">
              Next Lesson
            </p>
            <h3 className="font-semibold text-foreground truncate">
              {nextLesson.pupil.name}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span className={cn(isLessonToday && "text-primary font-medium")}>
                  {getDateLabel()} at {getTimeLabel()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-0.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{nextLesson.pupil.postcode}</span>
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </div>
      </div>
    </Link>
  );
}
