import { useState, useEffect } from "react";
import { Clock, Calendar, PoundSterling, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, differenceInMinutes } from "date-fns";

interface TodayAtAGlanceProps {
  instructorId: string | undefined;
}

interface TodayData {
  nextLesson: { pupilName: string; time: string; minutesUntil: number } | null;
  lessonsRemaining: number;
  hoursToday: number;
  earningsToday: number;
  loading: boolean;
}

export function TodayAtAGlance({ instructorId }: TodayAtAGlanceProps) {
  const [data, setData] = useState<TodayData>({
    nextLesson: null,
    lessonsRemaining: 0,
    hoursToday: 0,
    earningsToday: 0,
    loading: true,
  });

  useEffect(() => {
    if (!instructorId) return;

    const fetchToday = async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const now = new Date();

      try {
        // Fetch today's lessons with pupil info
        const { data: lessons } = await supabase
          .from("scheduled_lessons")
          .select("lesson_date, start_time, duration_minutes, status, pupils(name)")
          .eq("instructor_id", instructorId)
          .eq("lesson_date", today)
          .neq("status", "cancelled")
          .order("start_time", { ascending: true });

        const todayLessons = lessons || [];
        const totalMinutes = todayLessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);

        // Find next upcoming lesson
        let nextLesson: TodayData["nextLesson"] = null;
        for (const lesson of todayLessons) {
          if (lesson.start_time && lesson.status !== "completed") {
            const [h, m] = lesson.start_time.split(":").map(Number);
            const lessonTime = new Date(now);
            lessonTime.setHours(h, m, 0, 0);
            if (lessonTime > now) {
              const pupilName = (lesson.pupils as any)?.name || "Pupil";
              nextLesson = {
                pupilName,
                time: lesson.start_time.slice(0, 5),
                minutesUntil: differenceInMinutes(lessonTime, now),
              };
              break;
            }
          }
        }

        // Remaining lessons (not completed)
        const remaining = todayLessons.filter(l => l.status !== "completed").length;

        // Today's earnings
        const { data: payments } = await supabase
          .from("payment_history")
          .select("amount")
          .eq("instructor_id", instructorId)
          .gte("created_at", `${today}T00:00:00`)
          .lte("created_at", `${today}T23:59:59`);

        const earnings = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);

        setData({
          nextLesson,
          lessonsRemaining: remaining,
          hoursToday: Math.round(totalMinutes / 60 * 10) / 10,
          earningsToday: earnings,
          loading: false,
        });
      } catch (err) {
        console.error("TodayAtAGlance error:", err);
        setData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchToday();
  }, [instructorId]);

  const dateLabel = format(new Date(), "EEE d").toUpperCase();

  if (data.loading) {
    return (
      <div
        className="bg-white rounded-[24px] overflow-hidden ring-1 ring-black/5"
        style={{ boxShadow: "0 2px 12px -4px rgba(0,0,0,0.04)" }}
      >
        <div className="px-5 pt-5 pb-2 flex justify-between items-baseline">
          <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight">Today's Pulse</h2>
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest tabular-nums">{dateLabel}</span>
        </div>
        <div className="flex gap-3 px-5 pb-6 pt-2">
          {[156, 124, 124, 124].map((w, i) => (
            <div key={i} className="shrink-0 h-[108px] rounded-[16px] bg-gray-100 animate-pulse" style={{ width: w }} />
          ))}
        </div>
      </div>
    );
  }

  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const nextLessonChip = data.nextLesson
    ? {
        time: data.nextLesson.time,
        name: data.nextLesson.pupilName,
        subtitle: `Starts in ${formatMinutes(data.nextLesson.minutesUntil)}`,
      }
    : { time: "—", name: "No upcoming", subtitle: "Nothing scheduled" };

  return (
    <div
      className="bg-white rounded-[24px] overflow-hidden ring-1 ring-black/5"
      style={{ boxShadow: "0 2px 12px -4px rgba(0,0,0,0.04)" }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-2 flex justify-between items-baseline">
        <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight">Today's Pulse</h2>
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest tabular-nums">{dateLabel}</span>
      </div>

      {/* Scrollable chip strip */}
      <div
        className="flex overflow-x-auto snap-x snap-mandatory gap-3 px-5 pb-6 pt-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`.tag-pulse-strip::-webkit-scrollbar{display:none}`}</style>

        {/* Next Up — wider for hierarchy */}
        <div
          className="snap-start shrink-0 w-[156px] rounded-[16px] p-4 flex flex-col justify-between ring-1"
          style={{ backgroundColor: "#F0F6FF", borderColor: "transparent", boxShadow: "inset 0 0 0 1px rgba(0,86,214,0.10)" }}
        >
          <div className="flex items-center justify-between mb-5">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#0056D6" }}>
              Next Up
            </span>
            {data.nextLesson && (
              <div className="size-2 rounded-full animate-pulse" style={{ backgroundColor: "rgba(0,86,214,0.6)" }} />
            )}
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tighter text-gray-900 tabular-nums leading-none mb-1.5">
              {nextLessonChip.time}
            </div>
            <div className="text-[13px] font-medium text-gray-700 leading-tight truncate">{nextLessonChip.name}</div>
            <div className="text-[11px] font-medium text-gray-500 mt-0.5 truncate">{nextLessonChip.subtitle}</div>
          </div>
        </div>

        {/* Remaining */}
        <div
          className="snap-start shrink-0 w-[124px] rounded-[16px] p-4 flex flex-col justify-between"
          style={{ backgroundColor: "#FFF5EC", boxShadow: "inset 0 0 0 1px rgba(185,74,0,0.10)" }}
        >
          <div className="text-[10px] font-bold uppercase tracking-widest mb-5" style={{ color: "#B94A00" }}>
            Remaining
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tighter text-gray-900 tabular-nums leading-none mb-1.5">
              {data.lessonsRemaining}
            </div>
            <div className="text-[12px] font-medium text-gray-500 leading-snug">
              Lesson{data.lessonsRemaining !== 1 ? "s" : ""}
              <br />left today
            </div>
          </div>
        </div>

        {/* Hours */}
        <div
          className="snap-start shrink-0 w-[124px] rounded-[16px] p-4 flex flex-col justify-between"
          style={{ backgroundColor: "#F0FDF8", boxShadow: "inset 0 0 0 1px rgba(13,122,92,0.10)" }}
        >
          <div className="text-[10px] font-bold uppercase tracking-widest mb-5" style={{ color: "#0D7A5C" }}>
            Scheduled
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tighter text-gray-900 tabular-nums leading-none mb-1.5">
              {data.hoursToday}
              <span className="text-base font-medium text-gray-500 ml-0.5">h</span>
            </div>
            <div className="text-[12px] font-medium text-gray-500 leading-snug">
              Total time
              <br />on platform
            </div>
          </div>
        </div>

        {/* Earnings */}
        <div
          className="snap-start shrink-0 w-[124px] rounded-[16px] p-4 flex flex-col justify-between"
          style={{ backgroundColor: "#F8F5FF", boxShadow: "inset 0 0 0 1px rgba(96,56,208,0.10)" }}
        >
          <div className="text-[10px] font-bold uppercase tracking-widest mb-5" style={{ color: "#6038D0" }}>
            Earnings
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tighter text-gray-900 tabular-nums leading-none mb-1.5">
              £{data.earningsToday.toFixed(0)}
            </div>
            <div className="text-[12px] font-medium text-gray-500 leading-snug">
              Received
              <br />today
            </div>
          </div>
        </div>

        {/* End spacer */}
        <div className="snap-end shrink-0 w-1" aria-hidden />
      </div>
    </div>
  );
}
