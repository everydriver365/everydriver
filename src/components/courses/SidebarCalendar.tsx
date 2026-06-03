import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isBefore, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SidebarCalendarProps {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  selectedDate: Date | null;
  availableDates: Date[];
  onSelectDate: (date: Date) => void;
  loading: boolean;
  monthOptions: { value: string; label: string }[];
}

export function SidebarCalendar({
  selectedMonth,
  setSelectedMonth,
  selectedDate,
  availableDates,
  onSelectDate,
  loading,
  monthOptions,
}: SidebarCalendarProps) {
  const today = startOfDay(new Date());

  const calendarDays = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(monthStart);
    const startDay = getDay(monthStart);

    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const paddedDays: (Date | null)[] = Array(startDay).fill(null);
    days.forEach(day => paddedDays.push(day));

    while (paddedDays.length % 7 !== 0) {
      paddedDays.push(null);
    }

    return paddedDays.map(day => ({
      date: day,
      isAvailable: day ? availableDates.some(d => isSameDay(d, day)) : false,
      isPast: day ? isBefore(day, today) : false,
    }));
  }, [selectedMonth, availableDates, today]);

  const currentMonthIndex = monthOptions.findIndex(m => m.value === selectedMonth);

  const handlePrevMonth = () => {
    if (currentMonthIndex > 0) {
      setSelectedMonth(monthOptions[currentMonthIndex - 1].value);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex < monthOptions.length - 1) {
      setSelectedMonth(monthOptions[currentMonthIndex + 1].value);
    }
  };

  const [year, month] = selectedMonth.split("-").map(Number);
  const monthLabel = format(new Date(year, month - 1), "MMMM yyyy");

  const arrowCls =
    "flex h-[26px] w-[26px] items-center justify-center rounded-[5px] border border-[#E5E7EB] text-[#6B7280] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F3F4F6]";

  return (
    <div>
      {/* Section label */}
      <div className="mb-3 text-[10px] font-bold uppercase tracking-[1px] text-[#9CA3AF]">
        Start Date
      </div>

      {/* Month nav row */}
      <div className="mb-[10px] flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          disabled={currentMonthIndex <= 0}
          className={arrowCls}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-[13px] font-semibold text-[#0A0E27]">{monthLabel}</span>
        <button
          onClick={handleNextMonth}
          disabled={currentMonthIndex >= monthOptions.length - 1}
          className={arrowCls}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-7 gap-[2px]">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-8 w-full animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : (
        <>
          {/* Weekday headers */}
          <div className="mb-1 grid grid-cols-7 gap-[2px]">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <div
                key={i}
                className="py-[2px] text-center text-[9px] font-semibold text-[#9CA3AF]"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-[2px]">
            {calendarDays.map((day, index) => {
              if (!day.date) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="px-[2px] py-[5px] text-center text-[11px] text-[#D1D5DB]"
                  />
                );
              }

              const isSelected = selectedDate && isSameDay(day.date, selectedDate);
              const isToday = isSameDay(day.date, today);
              const disabled = !day.isAvailable || day.isPast;

              let stateCls = "text-[#D1D5DB] cursor-not-allowed";
              if (isSelected || (isToday && !disabled)) {
                stateCls = "bg-[#0A2B6B] text-white font-bold rounded-full";
              } else if (day.isAvailable && !day.isPast) {
                stateCls =
                  "bg-[#EFF6FF] text-[#0070C0] font-bold rounded-full hover:opacity-90 cursor-pointer";
              }

              return (
                <button
                  key={day.date.toISOString()}
                  onClick={() => !disabled && onSelectDate(day.date!)}
                  disabled={disabled}
                  className={`px-[2px] py-[5px] text-center text-[11px] rounded-[4px] transition-colors ${stateCls}`}
                >
                  {format(day.date, "d")}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Legend */}
      <div className="mt-[10px] flex gap-3 border-t border-[#F3F4F6] pt-[10px]">
        <div className="flex items-center gap-1.5">
          <span className="h-[10px] w-[10px] rounded-full border border-[#0070C0] bg-[#EFF6FF]" />
          <span className="text-[10px] text-[#9CA3AF]">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-[10px] w-[10px] rounded-full bg-[#0A2B6B]" />
          <span className="text-[10px] text-[#9CA3AF]">Selected</span>
        </div>
      </div>
    </div>
  );
}
