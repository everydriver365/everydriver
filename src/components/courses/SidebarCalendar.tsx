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
    if (currentMonthIndex > 0) setSelectedMonth(monthOptions[currentMonthIndex - 1].value);
  };

  const handleNextMonth = () => {
    if (currentMonthIndex < monthOptions.length - 1) setSelectedMonth(monthOptions[currentMonthIndex + 1].value);
  };

  const [year, month] = selectedMonth.split("-").map(Number);
  const monthLabel = format(new Date(year, month - 1), "MMMM yyyy");

  const arrowCls =
    "flex h-[22px] w-[22px] items-center justify-center rounded-[5px] border border-[#E5E7EB] text-[11px] text-[#6B7280] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F3F4F6]";

  return (
    <div
      className="bg-white w-full"
      style={{
        border: "0.5px solid #E5E7EB",
        borderRadius: 12,
        padding: 16,
      }}
    >
      {/* Section label */}
      <div
        className="text-[#9CA3AF]"
        style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          marginBottom: 10,
        }}
      >
        Start Date
      </div>

      {/* Month nav row */}
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <button
          onClick={handlePrevMonth}
          disabled={currentMonthIndex <= 0}
          className={arrowCls}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-3 w-3" />
        </button>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#0A0E27" }}>{monthLabel}</span>
        <button
          onClick={handleNextMonth}
          disabled={currentMonthIndex >= monthOptions.length - 1}
          className={arrowCls}
          aria-label="Next month"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-7" style={{ gap: 3 }}>
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-[5px] bg-muted" />
          ))}
        </div>
      ) : (
        <>
          {/* Weekday headers */}
          <div className="grid grid-cols-7" style={{ marginBottom: 4 }}>
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <div
                key={i}
                className="text-center"
                style={{
                  fontSize: 8,
                  fontWeight: 600,
                  color: "#C4C9D4",
                  padding: "2px 0",
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7" style={{ gap: 3 }}>
            {calendarDays.map((day, index) => {
              if (!day.date) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const isSelected = !!(selectedDate && isSameDay(day.date, selectedDate));
              const disabled = !day.isAvailable || day.isPast;

              let bg = "transparent";
              let color = "#C4C9D4";
              let weight: number = 400;
              let cursor = "default";
              let hoverCls = "";

              if (isSelected) {
                bg = "#0A2B6B";
                color = "white";
                weight = 700;
                cursor = "pointer";
              } else if (!disabled) {
                bg = "#EEF2FF";
                color = "#0A0E27";
                weight = 500;
                cursor = "pointer";
                hoverCls = "hover:!bg-[#DBEAFE]";
              }

              return (
                <button
                  key={day.date.toISOString()}
                  onClick={() => !disabled && onSelectDate(day.date!)}
                  disabled={disabled}
                  className={`aspect-square flex items-center justify-center rounded-[5px] transition-colors ${hoverCls}`}
                  style={{
                    background: bg,
                    color,
                    fontWeight: weight,
                    fontSize: 10,
                    cursor,
                  }}
                >
                  {format(day.date, "d")}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Legend */}
      <div
        className="flex items-center"
        style={{
          borderTop: "1px solid #F3F4F6",
          paddingTop: 10,
          marginTop: 10,
          gap: 14,
        }}
      >
        <div className="flex items-center" style={{ gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: "#EEF2FF" }} />
          <span style={{ fontSize: 9, color: "#9CA3AF" }}>Available</span>
        </div>
        <div className="flex items-center" style={{ gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: "#0A2B6B" }} />
          <span style={{ fontSize: 9, color: "#9CA3AF" }}>Selected</span>
        </div>
      </div>
    </div>
  );
}
