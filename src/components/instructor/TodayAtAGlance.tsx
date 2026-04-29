import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInMinutes } from "date-fns";

interface TodayAtAGlanceProps {
  instructorId: string | undefined;
}

interface TodayData {
  nextLesson: {
    pupilName: string;
    time: string;
    minutesUntil: number;
    postcode: string | null;
  } | null;
  lessonsRemaining: number;
  lessonsCompleted: number;
  hoursToday: number;
  earningsToday: number;
  remainingPostcode: string | null;
  scheduledPostcode: string | null;
  loading: boolean;
}

const SHADOW = "0 2px 12px -4px rgba(0,0,0,0.04)";

export function TodayAtAGlance({ instructorId }: TodayAtAGlanceProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<TodayData>({
    nextLesson: null,
    lessonsRemaining: 0,
    lessonsCompleted: 0,
    hoursToday: 0,
    earningsToday: 0,
    remainingPostcode: null,
    scheduledPostcode: null,
    loading: true,
  });

  useEffect(() => {
    if (!instructorId) return;

    const fetchToday = async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const now = new Date();

      try {
        const { data: lessons } = await supabase
          .from("scheduled_lessons")
          .select(
            "lesson_date, start_time, duration_minutes, status, pickup_postcode, pupils(name, pickup_postcode, postcode)"
          )
          .eq("instructor_id", instructorId)
          .eq("lesson_date", today)
          .neq("status", "cancelled")
          .order("start_time", { ascending: true });

        const todayLessons = lessons || [];
        const totalMinutes = todayLessons.reduce(
          (sum, l) => sum + (l.duration_minutes || 0),
          0
        );

        const outward = (pc: string | null | undefined): string | null => {
          if (!pc) return null;
          const trimmed = pc.trim().toUpperCase();
          if (!trimmed) return null;
          const space = trimmed.indexOf(" ");
          return space > 0 ? trimmed.slice(0, space) : trimmed.slice(0, 4);
        };

        const lessonPostcode = (l: any): string | null => {
          const p = l?.pupils as any;
          return outward(l?.pickup_postcode || p?.pickup_postcode || p?.postcode);
        };

        let nextLesson: TodayData["nextLesson"] = null;
        let remainingPostcode: string | null = null;
        for (const lesson of todayLessons) {
          if (lesson.start_time && lesson.status !== "completed") {
            const [h, m] = lesson.start_time.split(":").map(Number);
            const lessonTime = new Date(now);
            lessonTime.setHours(h, m, 0, 0);
            if (lessonTime > now) {
              const pupilName = (lesson.pupils as any)?.name || "Pupil";
              const pc = lessonPostcode(lesson);
              nextLesson = {
                pupilName,
                time: lesson.start_time.slice(0, 5),
                minutesUntil: differenceInMinutes(lessonTime, now),
                postcode: pc,
              };
              remainingPostcode = pc;
              break;
            }
          }
        }

        const remaining = todayLessons.filter((l) => l.status !== "completed").length;
        const completed = todayLessons.filter((l) => l.status === "completed").length;
        const scheduledPostcode =
          todayLessons.length > 0 ? lessonPostcode(todayLessons[0]) : null;

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
          lessonsCompleted: completed,
          hoursToday: Math.round((totalMinutes / 60) * 10) / 10,
          earningsToday: earnings,
          remainingPostcode,
          scheduledPostcode,
          loading: false,
        });
      } catch (err) {
        console.error("TodayAtAGlance error:", err);
        setData((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchToday();
  }, [instructorId]);

  const dateLabel = format(new Date(), "EEE d").toUpperCase();
  const numStyle = { fontVariantNumeric: "tabular-nums" as const };

  if (data.loading) {
    return (
      <div
        className="bg-white rounded-[24px] overflow-hidden ring-1 ring-black/5"
        style={{ boxShadow: SHADOW }}
      >
        <div className="px-5 pt-5 pb-2 flex justify-between items-baseline">
          <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight">
            Today's Pulse
          </h2>
          <span
            className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest"
            style={numStyle}
          >
            {dateLabel}
          </span>
        </div>
        <div className="flex gap-3 px-5 pb-6 pt-2">
          {[156, 124, 124, 124].map((w, i) => (
            <div
              key={i}
              className="shrink-0 h-[108px] rounded-[16px] bg-gray-100 animate-pulse"
              style={{ width: w }}
            />
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

  // End-of-day hero state: nothing left, but at least one was completed
  const isEndOfDay = data.lessonsRemaining === 0 && data.lessonsCompleted > 0;

  if (isEndOfDay) {
    return (
      <div
        className="bg-white rounded-[24px] overflow-hidden ring-1 ring-black/5"
        style={{ boxShadow: SHADOW }}
      >
        <div className="px-5 pt-5 pb-2 flex justify-between items-baseline">
          <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight">
            Today's Pulse
          </h2>
          <span
            className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest"
            style={numStyle}
          >
            {dateLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate("/instructor/income")}
          className="w-full text-left px-5 pb-5 pt-2 active:opacity-70 transition-opacity"
        >
          <div
            className="rounded-[16px] p-4 flex items-center gap-3"
            style={{
              background: "linear-gradient(135deg, #F0FDF8 0%, #F8F5FF 100%)",
              boxShadow: "inset 0 0 0 1px rgba(13,122,92,0.10)",
            }}
          >
            <div
              className="size-9 rounded-full flex items-center justify-center text-white text-base"
              style={{ backgroundColor: "#0D7A5C" }}
              aria-hidden
            >
              ✓
            </div>
            <div className="min-w-0 flex-1">
              <div
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "#0D7A5C" }}
              >
                Day Complete
              </div>
              <div className="text-[14px] font-semibold text-gray-900 leading-tight mt-0.5">
                <span style={numStyle}>{data.hoursToday}h</span> taught ·{" "}
                <span style={numStyle}>£{data.earningsToday.toFixed(0)}</span> collected
              </div>
              <div className="text-[11px] font-medium text-gray-500 mt-0.5">
                Tap to review the day →
              </div>
            </div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-[24px] overflow-hidden ring-1 ring-black/5"
      style={{ boxShadow: SHADOW }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-2 flex justify-between items-baseline">
        <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight">
          Today's Pulse
        </h2>
        <span
          className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest"
          style={numStyle}
        >
          {dateLabel}
        </span>
      </div>

      {/* Scrollable chip strip */}
      <div
        className="flex overflow-x-auto snap-x snap-mandatory gap-3 px-5 pb-6 pt-2 today-pulse-strip"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`.today-pulse-strip::-webkit-scrollbar{display:none}`}</style>

        {/* Next Up — only if there is one */}
        {data.nextLesson && (
          <button
            type="button"
            onClick={() => navigate("/instructor/schedule")}
            className="snap-start shrink-0 w-[156px] rounded-[16px] p-4 flex flex-col justify-between text-left active:scale-[0.98] transition-transform"
            style={{
              backgroundColor: "#F0F6FF",
              boxShadow: "inset 0 0 0 1px rgba(0,86,214,0.10)",
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "#0056D6" }}
              >
                Next Up
              </span>
              {data.nextLesson.postcode ? (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    color: "#0056D6",
                    backgroundColor: "rgba(0,86,214,0.10)",
                    ...numStyle,
                  }}
                  title="Next lesson postcode"
                >
                  {data.nextLesson.postcode}
                </span>
              ) : (
                <div
                  className="size-2 rounded-full animate-pulse"
                  style={{ backgroundColor: "rgba(0,86,214,0.6)" }}
                />
              )}
            </div>
            <div>
              <div
                className="text-2xl font-bold tracking-tighter text-gray-900 leading-none mb-1.5"
                style={numStyle}
              >
                {data.nextLesson.time}
              </div>
              <div className="text-[13px] font-medium text-gray-700 leading-tight truncate">
                {data.nextLesson.pupilName}
              </div>
              <div
                className="text-[11px] font-medium text-gray-500 mt-0.5 truncate"
                style={numStyle}
              >
                Starts in {formatMinutes(data.nextLesson.minutesUntil)}
              </div>
            </div>
          </button>
        )}

        {/* Remaining */}
        <button
          type="button"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("home:scroll-to-today-schedule"))
          }
          className="snap-start shrink-0 w-[124px] rounded-[16px] p-4 flex flex-col justify-between text-left active:scale-[0.98] transition-transform"
          style={{
            backgroundColor: "#FFF5EC",
            boxShadow: "inset 0 0 0 1px rgba(185,74,0,0.10)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "#B94A00" }}
            >
              Remaining
            </span>
            {data.remainingPostcode && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                style={{
                  color: "#B94A00",
                  backgroundColor: "rgba(185,74,0,0.10)",
                  ...numStyle,
                }}
                title="Next remaining lesson postcode"
              >
                {data.remainingPostcode}
              </span>
            )}
          </div>
          <div>
            <div
              className="text-2xl font-bold tracking-tighter text-gray-900 leading-none mb-1.5"
              style={numStyle}
            >
              {data.lessonsRemaining}
            </div>
            <div className="text-[12px] font-medium text-gray-500 leading-snug">
              Lesson{data.lessonsRemaining !== 1 ? "s" : ""}
              <br />
              left today
            </div>
          </div>
        </button>

        {/* Hours / Scheduled */}
        <button
          type="button"
          onClick={() => navigate("/instructor/schedule")}
          className="snap-start shrink-0 w-[124px] rounded-[16px] p-4 flex flex-col justify-between text-left active:scale-[0.98] transition-transform"
          style={{
            backgroundColor: "#F0FDF8",
            boxShadow: "inset 0 0 0 1px rgba(13,122,92,0.10)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "#0D7A5C" }}
            >
              Scheduled
            </span>
            {data.scheduledPostcode && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                style={{
                  color: "#0D7A5C",
                  backgroundColor: "rgba(13,122,92,0.10)",
                  ...numStyle,
                }}
                title="First scheduled lesson postcode"
              >
                {data.scheduledPostcode}
              </span>
            )}
          </div>
          <div>
            <div
              className="text-2xl font-bold tracking-tighter text-gray-900 leading-none mb-1.5"
              style={numStyle}
            >
              {data.hoursToday}
              <span className="text-base font-medium text-gray-500 ml-0.5">h</span>
            </div>
            <div className="text-[12px] font-medium text-gray-500 leading-snug">
              Total time
              <br />
              on platform
            </div>
          </div>
        </button>

        {/* Earnings */}
        <button
          type="button"
          onClick={() => navigate("/instructor/income")}
          className="snap-start shrink-0 w-[124px] rounded-[16px] p-4 flex flex-col justify-between text-left active:scale-[0.98] transition-transform"
          style={{
            backgroundColor: "#F8F5FF",
            boxShadow: "inset 0 0 0 1px rgba(96,56,208,0.10)",
          }}
        >
          <div
            className="text-[10px] font-bold uppercase tracking-widest mb-5"
            style={{ color: "#6038D0" }}
          >
            Earnings
          </div>
          <div>
            <div
              className="text-2xl font-bold tracking-tighter text-gray-900 leading-none mb-1.5"
              style={numStyle}
            >
              £{data.earningsToday.toFixed(0)}
            </div>
            <div className="text-[12px] font-medium text-gray-500 leading-snug">
              Received
              <br />
              today
            </div>
          </div>
        </button>

        {/* End spacer */}
        <div className="snap-end shrink-0 w-1" aria-hidden />
      </div>
    </div>
  );
}
