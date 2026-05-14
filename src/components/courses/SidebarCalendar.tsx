import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isBefore, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AvatarInstructor {
  id: string;
  name: string;
  profile_image_url: string | null;
}

interface SidebarCalendarProps {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  selectedDate: Date | null;
  availableDates: Date[];
  onSelectDate: (date: Date) => void;
  loading: boolean;
  monthOptions: { value: string; label: string }[];
  /** YYYY-MM-DD → instructors free that day. Optional. */
  availableInstructorsByDate?: Map<string, AvatarInstructor[]>;
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function SidebarCalendar({
  selectedMonth,
  setSelectedMonth,
  selectedDate,
  availableDates,
  onSelectDate,
  loading,
  monthOptions,
  availableInstructorsByDate,
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

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      {/* Month Dropdown */}
      <div className="mb-4">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-full bg-background">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] bg-popover z-50">
            {monthOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Month Navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          disabled={currentMonthIndex === 0}
          className="rounded-md p-1.5 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold">{monthLabel}</span>
        <button
          onClick={handleNextMonth}
          disabled={currentMonthIndex >= monthOptions.length - 1}
          className="rounded-md p-1.5 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-9 w-full animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      ) : (
        <>
          {/* Weekday headers */}
          <div className="mb-1 grid grid-cols-7 gap-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <TooltipProvider delayDuration={150}>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (!day.date) {
                  return <div key={`empty-${index}`} className="h-12" />;
                }

                const isSelected = selectedDate && isSameDay(day.date, selectedDate);
                const isToday = isSameDay(day.date, today);
                const dayKey = format(day.date, "yyyy-MM-dd");
                const freeInstructors = day.isAvailable
                  ? availableInstructorsByDate?.get(dayKey) ?? []
                  : [];
                const visible = freeInstructors.slice(0, 3);
                const overflow = Math.max(0, freeInstructors.length - visible.length);

                const button = (
                  <button
                    key={day.date.toISOString()}
                    onClick={() => day.isAvailable && onSelectDate(day.date!)}
                    disabled={!day.isAvailable || day.isPast}
                    className={`relative flex h-12 w-full flex-col items-center justify-start rounded-md pt-1 text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-md"
                        : day.isAvailable
                          ? "bg-emerald-500/20 text-emerald-700 hover:bg-emerald-500/30 dark:text-emerald-400"
                          : day.isPast
                            ? "text-muted-foreground/30 cursor-not-allowed"
                            : "text-muted-foreground/50 cursor-not-allowed"
                    } ${isToday && !isSelected ? "ring-1 ring-primary/40" : ""}`}
                  >
                    <span className="leading-none">{format(day.date, "d")}</span>
                    {visible.length > 0 && (
                      <div className="mt-1 flex items-center -space-x-1.5">
                        {visible.map((ins) => (
                          <Avatar
                            key={ins.id}
                            className="h-4 w-4 ring-2 ring-card"
                          >
                            {ins.profile_image_url ? (
                              <AvatarImage src={ins.profile_image_url} alt={ins.name} />
                            ) : null}
                            <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">
                              {getInitials(ins.name)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {overflow > 0 && (
                          <span className="ml-1 rounded-full bg-muted px-1 text-[8px] font-semibold text-muted-foreground">
                            +{overflow}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );

                if (freeInstructors.length === 0) return button;

                return (
                  <Tooltip key={day.date.toISOString()}>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {freeInstructors.map((i) => i.name).join(", ")}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </>
      )}
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground border-t pt-3">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-emerald-500/20" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-primary" />
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
}
