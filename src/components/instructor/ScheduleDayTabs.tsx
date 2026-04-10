import { useState, useEffect, useCallback } from "react";
import { format, addDays, addWeeks, subWeeks, startOfWeek, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";

interface ScheduleDayTabsProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function ScheduleDayTabs({ selectedDate, onSelectDate }: ScheduleDayTabsProps) {
  const { instructor } = useInstructorAuth();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(selectedDate, { weekStartsOn: 1 }));
  const [eventDots, setEventDots] = useState<Record<string, number>>({});

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Fetch lesson counts for the visible week
  const fetchEventDots = useCallback(async () => {
    if (!instructor?.id) return;
    const from = format(weekStart, "yyyy-MM-dd");
    const to = format(addDays(weekStart, 6), "yyyy-MM-dd");
    const weekStartISO = new Date(from + "T00:00:00").toISOString();
    const weekEndISO = new Date(to + "T23:59:59").toISOString();
    try {
      const [lessonsRes, externalRes, blocksRes] = await Promise.all([
        supabase
          .from("scheduled_lessons")
          .select("lesson_date")
          .eq("instructor_id", instructor.id)
          .neq("status", "cancelled")
          .gte("lesson_date", from)
          .lte("lesson_date", to),
        supabase
          .from("instructor_calendar_events")
          .select("start_time")
          .eq("instructor_id", instructor.id)
          .gte("start_time", weekStartISO)
          .lte("start_time", weekEndISO),
        supabase
          .from("instructor_manual_blocks")
          .select("start_datetime")
          .eq("instructor_id", instructor.id)
          .gte("start_datetime", weekStartISO)
          .lte("start_datetime", weekEndISO),
      ]);

      const counts: Record<string, number> = {};
      lessonsRes.data?.forEach((r) => {
        counts[r.lesson_date] = (counts[r.lesson_date] || 0) + 1;
      });
      externalRes.data?.forEach((r) => {
        const dateStr = r.start_time.slice(0, 10);
        counts[dateStr] = (counts[dateStr] || 0) + 1;
      });
      blocksRes.data?.forEach((r) => {
        const dateStr = r.start_datetime.slice(0, 10);
        counts[dateStr] = (counts[dateStr] || 0) + 1;
      });
      setEventDots(counts);
    } catch (e) {
      console.error("Failed to fetch event dots:", e);
    }
  }, [instructor?.id, weekStart]);

  useEffect(() => {
    fetchEventDots();
  }, [fetchEventDots]);

  // Keep week in sync when selectedDate changes externally
  useEffect(() => {
    const newWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    if (!isSameDay(newWeekStart, weekStart)) {
      setWeekStart(newWeekStart);
    }
  }, [selectedDate]);

  const goToPrevWeek = () => {
    const prev = subWeeks(weekStart, 1);
    setWeekStart(prev);
    onSelectDate(addDays(prev, selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1));
  };

  const goToNextWeek = () => {
    const next = addWeeks(weekStart, 1);
    setWeekStart(next);
    onSelectDate(addDays(next, selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1));
  };

  return (
    <div className="space-y-3">
      {/* Month / Year header with arrows */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={goToPrevWeek}
          className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted active:scale-95 transition-all"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <h2 className="text-lg font-bold text-foreground">
          {format(days[3], "MMMM yyyy")}
        </h2>
        <button
          onClick={goToNextWeek}
          className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted active:scale-95 transition-all"
        >
          <ChevronRight className="h-5 w-5 text-foreground" />
        </button>
      </div>

      {/* Day pills row */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date) => {
          const selected = isSameDay(date, selectedDate);
          const dateStr = format(date, "yyyy-MM-dd");
          const dotCount = eventDots[dateStr] || 0;

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(date)}
              className="flex flex-col items-center gap-0.5 py-1 active:scale-95 transition-transform"
            >
              <span className="text-[11px] font-medium text-muted-foreground">
                {format(date, "EEE")}
              </span>
              <div
                className={`
                  w-10 h-10 flex items-center justify-center rounded-none text-base font-bold transition-all
                  ${selected
                    ? "bg-[#1a3a4a] text-white shadow-md"
                    : "text-foreground"
                  }
                `}
              >
                {format(date, "d")}
              </div>
              {/* Event dots */}
              <div className="flex gap-0.5 h-2 items-center justify-center">
                {dotCount > 0 &&
                  Array.from({ length: Math.min(dotCount, 3) }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        selected ? "bg-[#1a3a4a]" : "bg-amber-400"
                      }`}
                    />
                  ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
