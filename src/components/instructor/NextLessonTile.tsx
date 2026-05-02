import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, MapPin, ChevronRight, Car, Loader2, Calendar, Hourglass, Navigation, Phone, ExternalLink } from "lucide-react";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { PupilAvatar } from "./PupilAvatar";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { useTrafficETA } from "@/hooks/useTrafficETA";
import { LessonRouteRecorder } from "./LessonRouteRecorder";
import { Link, useNavigate } from "react-router-dom";
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
    phone: string | null;
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
  const [showRecorder, setShowRecorder] = useState(false);
  const navigate = useNavigate();

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
            phone,
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
      <div className="rounded-2xl p-4 animate-pulse"
        style={{
          background: "rgba(255,255,255,0.65)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="h-16 bg-muted/30 rounded-2xl" />
      </div>
    );
  }

  if (!nextLesson) return null;

  const lessonDate = parseISO(nextLesson.lesson_date);
  const isLessonToday = isToday(lessonDate);
  const isLessonTomorrow = isTomorrow(lessonDate);

  const getDateLabel = () => {
    if (isLessonToday) return "Today";
    if (isLessonTomorrow) return "Tomorrow";
    return format(lessonDate, "EEE, d MMM");
  };

  const getTimeLabel = () => nextLesson.start_time.slice(0, 5);

  const getDurationLabel = () => {
    const mins = nextLesson.duration_minutes;
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `${h}.${Math.round((m / 60) * 10)}h` : `${h}h`;
    }
    return `${mins}m`;
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
    <div className="space-y-2">
    <Link
      to={`/instructor/schedule?date=${nextLesson.lesson_date}`}
      className="block"
    >
      <div
        className="w-full overflow-hidden hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
        style={{
          background: "rgba(255,255,255,0.65)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: 12,
          boxShadow: "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
          border: "1px solid rgba(255,255,255,0.5)",
        }}
      >
        <div className="px-4 pt-4 pb-3 flex flex-col gap-2.5">
          {/* Top row: Avatar + Name + Time */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className="rounded-full p-[2px]"
                style={{ background: "linear-gradient(135deg, #3B82F6, #2A394F)" }}
              >
                <PupilAvatar
                  name={nextLesson.pupil.name}
                  imageUrl={nextLesson.pupil.profile_image_url}
                  size="lg"
                />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.5px]"
                  style={{ color: "#2A394F" }}
                >
                  Next Up
                </span>
              </div>
              <h3
                className="font-bold truncate text-[20px] mt-0.5"
                style={{ color: "hsl(var(--foreground))" }}
              >
                {nextLesson.pupil.name}
              </h3>
            </div>

            <div className="flex flex-col items-end shrink-0">
              <span
                className="text-[22px] font-bold"
                style={{
                  color: "hsl(var(--foreground))",
                  fontVariantNumeric: "tabular-nums",
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                {getTimeLabel()}
              </span>
              <div className="h-8 w-8 rounded-full flex items-center justify-center mt-1" style={{ background: "rgba(99,102,241,0.1)" }}>
                <ChevronRight className="h-4 w-4" style={{ color: "#2A394F" }} />
              </div>
            </div>
          </div>

          {/* Info pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-[6px] rounded-full text-[11px] font-semibold"
              style={{ background: "rgba(99,102,241,0.1)", color: "#4338CA" }}
            >
              <Calendar className="h-[11px] w-[11px]" />
              {getDateLabel()}
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-[6px] rounded-full text-[11px] font-semibold"
              style={{ background: "rgba(99,102,241,0.1)", color: "#4338CA" }}
            >
              <Hourglass className="h-[11px] w-[11px]" />
              {getDurationLabel()}
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-[6px] rounded-full text-[11px] font-semibold"
              style={{ background: "rgba(99,102,241,0.1)", color: "#4338CA" }}
            >
              <MapPin className="h-[11px] w-[11px]" />
              {nextLesson.pupil.pickup_postcode || nextLesson.pupil.postcode}
            </span>
          </div>

          {/* Location + Payment + ETA row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[12px] min-w-0" style={{ color: "#9CA3AF" }}>
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {nextLesson.pupil.pickup_address || nextLesson.pupil.address || nextLesson.pupil.pickup_postcode || nextLesson.pupil.postcode}
              </span>
            </div>
            <PaymentStatusBadge
              balance={effectiveBalance}
              size="sm"
              className="rounded-full bg-black/5 border-black/10 text-foreground/70 dark:bg-white/10 dark:border-white/15 dark:text-foreground/80"
            />
          </div>

          {/* ETA + Record Route row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "#9CA3AF" }}>
              {etaLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : durationMinutes ? (
                <>
                  <Car className="h-3.5 w-3.5" />
                  <span>ETA {getArrivalTime()} ({durationText})</span>
                  {trafficCondition && (
                    <span className="text-[11px]">{getTrafficEmoji()}</span>
                  )}
                </>
              ) : null}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowRecorder(!showRecorder);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-[6px] rounded-full text-[11px] font-semibold transition-colors"
              style={{
                background: showRecorder ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                color: showRecorder ? "#DC2626" : "#16A34A",
              }}
            >
              <Navigation className="h-[11px] w-[11px]" />
              {showRecorder ? "Hide Recorder" : "Record Route"}
            </button>
          </div>

          {/* Action buttons: Call / Navigate / Open */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (nextLesson.pupil.phone) {
                  window.location.href = `tel:${nextLesson.pupil.phone}`;
                }
              }}
              disabled={!nextLesson.pupil.phone}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all active:scale-95 disabled:opacity-40"
              style={{ background: "rgba(34,197,94,0.1)", color: "#16A34A" }}
            >
              <Phone className="h-3.5 w-3.5" />
              Call
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const dest = nextLesson.pupil.pickup_address || nextLesson.pupil.address || nextLesson.pupil.pickup_postcode || nextLesson.pupil.postcode;
                if (dest) {
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`, "_blank");
                }
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all active:scale-95"
              style={{ background: "rgba(59,130,246,0.1)", color: "#2563EB" }}
            >
              <Navigation className="h-3.5 w-3.5" />
              Navigate
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/instructor/pupils/${nextLesson.pupil.id}?lesson=${nextLesson.id}`);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all active:scale-95"
              style={{ background: "rgba(99,102,241,0.1)", color: "#4338CA" }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </button>
          </div>
        </div>
      </div>
    </Link>

    {showRecorder && (
      <LessonRouteRecorder
        instructorId={instructorId}
        pupilId={nextLesson.pupil.id}
        lessonId={nextLesson.id}
        onRouteRecorded={() => setShowRecorder(false)}
      />
    )}
    </div>
  );
}
