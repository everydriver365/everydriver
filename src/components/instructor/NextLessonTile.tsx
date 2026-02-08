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
    pickup_address: string | null;
    pickup_postcode: string | null;
    address: string | null;
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
            pickup_address,
            pickup_postcode,
            address,
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
      <div
        className={cn(
          "rounded-2xl p-4 text-white bg-gradient-to-br from-primary to-primary/80",
          "hover:shadow-lg transition-all duration-200"
        )}
      >
        <div className="flex items-center gap-3">
          {/* Avatar with ring */}
          <div className="relative">
            <div className="ring-2 ring-white/30 ring-offset-2 ring-offset-primary rounded-full">
              <PupilAvatar
                name={nextLesson.pupil.name}
                imageUrl={nextLesson.pupil.profile_image_url}
                size="lg"
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-primary-foreground/70 font-medium uppercase tracking-wide mb-0.5">
              Next Lesson
            </p>
            <h3 className="font-semibold text-primary-foreground truncate text-lg">
              {nextLesson.pupil.name}
            </h3>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-1">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">
                  {getDateLabel()} · {getTimeLabel()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-sm text-primary-foreground/80">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">
                {nextLesson.pupil.pickup_postcode || nextLesson.pupil.postcode}
              </span>
            </div>
          </div>

          {/* Arrow */}
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <ChevronRight className="h-5 w-5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
