import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, MapPin, ChevronRight, Car, Loader2 } from "lucide-react";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { PupilAvatar } from "./PupilAvatar";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { useTrafficETA } from "@/hooks/useTrafficETA";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import nextUpIcon from "@/assets/next_up_white.png";

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
    account_balance: number;
    prepaid_hours: number;
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
            profile_image_url,
            account_balance,
            prepaid_hours
          )
        `)
        .eq("instructor_id", instructorId)
        .gte("lesson_date", today)
        .order("lesson_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(10);

      if (error) throw error;

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

  const destinationPostcode = nextLesson?.pupil.pickup_postcode || nextLesson?.pupil.postcode || null;
  const { durationMinutes, durationText, trafficCondition, isLoading: etaLoading } = useTrafficETA(destinationPostcode);

  // Compute actual arrival time (now + travel duration)
  const getArrivalTime = () => {
    if (!durationMinutes) return null;
    const arrival = new Date(Date.now() + durationMinutes * 60 * 1000);
    return format(arrival, "HH:mm");
  };

  const effectiveBalance = nextLesson
    ? (nextLesson.pupil.prepaid_hours > 0
        ? nextLesson.pupil.prepaid_hours * 40
        : nextLesson.pupil.account_balance || 0)
    : 0;

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

  const getTrafficEmoji = () => {
    if (!trafficCondition) return "";
    switch (trafficCondition.toLowerCase()) {
      case "clear": return "🟢";
      case "light": return "🟡";
      case "moderate": return "🟠";
      case "heavy": return "🔴";
      default: return "";
    }
  };

  return (
    <Link
      to={`/instructor/schedule?date=${nextLesson.lesson_date}`}
      className="block"
    >
      <div
        className={cn(
          "rounded-2xl p-4 text-primary-foreground bg-gradient-to-br from-primary via-primary/90 to-primary/80",
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
            <div className="flex items-center gap-1.5 mb-0.5">
              <img src={nextUpIcon} alt="Next Up" className="h-4 object-contain" />
            </div>
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
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex items-center gap-1.5 text-sm text-primary-foreground/80">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">
                  {nextLesson.pupil.pickup_postcode || nextLesson.pupil.postcode}
                </span>
              </div>
              <PaymentStatusBadge
                balance={effectiveBalance}
                size="sm"
                className="rounded-none bg-white/15 border-white/20 text-white [&_svg]:text-white"
              />
            </div>
            {/* ETA row */}
            <div className="flex items-center gap-1.5 mt-1.5 text-sm text-primary-foreground/80">
              {etaLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : durationMinutes ? (
                <>
                  <Car className="h-3.5 w-3.5" />
                  <span>ETA {getArrivalTime()} ({durationText})</span>
                  {trafficCondition && (
                    <span className="text-xs">{getTrafficEmoji()}</span>
                  )}
                </>
              ) : null}
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
