import { useState, useMemo } from "react";
import { format, getDaysInMonth, setMonth, setYear, startOfMonth, getDay } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DobCalendarPickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  onSave: () => void;
  onCancel: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  displayValue: string;
  placeholder?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1940 + 1 }, (_, i) => currentYear - i);

export function DobCalendarPicker({
  value,
  onChange,
  onSave,
  onCancel,
  open,
  onOpenChange,
  displayValue,
  placeholder = "Click to add",
}: DobCalendarPickerProps) {
  const [viewDate, setViewDate] = useState<Date>(value || new Date(2000, 0, 1));

  const viewMonth = viewDate.getMonth();
  const viewYear = viewDate.getFullYear();

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewDate);
    const firstDay = getDay(startOfMonth(viewDate));
    // Convert Sunday=0 to Monday-start: Mon=0 … Sun=6
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    const days: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [viewDate]);

  const isToday = (day: number) => {
    const now = new Date();
    return day === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    return day === value.getDate() && viewMonth === value.getMonth() && viewYear === value.getFullYear();
  };

  const isFuture = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    return d > new Date();
  };

  const handleDayClick = (day: number) => {
    if (isFuture(day)) return;
    onChange(new Date(viewYear, viewMonth, day));
  };

  const handlePrevMonth = () => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      if (newDate > new Date()) return prev;
      return newDate;
    });
  };

  const handleMonthChange = (m: string) => {
    setViewDate(setMonth(viewDate, parseInt(m)));
  };

  const handleYearChange = (y: string) => {
    setViewDate(setYear(viewDate, parseInt(y)));
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button className="group flex items-center gap-2 text-left rounded-md py-0.5 transition-colors hover:bg-muted/50 cursor-pointer w-full">
          <span className={cn("text-sm", displayValue ? "text-foreground" : "text-muted-foreground italic")}>
            {displayValue || placeholder}
          </span>
          <CalendarIcon className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 rounded-2xl shadow-xl border-border/50" align="start">
        {/* Header with month/year selectors */}
        <div className="flex items-center justify-between gap-1 px-3 pt-3 pb-2">
          <button
            onClick={handlePrevMonth}
            className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="flex items-center gap-1.5">
            <Select value={String(viewMonth)} onValueChange={handleMonthChange}>
              <SelectTrigger className="h-8 w-[110px] border-0 shadow-none bg-muted/50 rounded-lg text-sm font-medium focus:ring-0 px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {MONTHS.map((m, i) => (
                  <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(viewYear)} onValueChange={handleYearChange}>
              <SelectTrigger className="h-8 w-[80px] border-0 shadow-none bg-muted/50 rounded-lg text-sm font-medium focus:ring-0 px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {YEARS.map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <button
            onClick={handleNextMonth}
            className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 px-3">
          {WEEKDAYS.map(d => (
            <div key={d} className="h-8 flex items-center justify-center">
              <span className="text-[11px] font-medium text-muted-foreground/70">{d}</span>
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 px-3 pb-2">
          {calendarDays.map((day, i) => (
            <div key={i} className="flex items-center justify-center">
              {day ? (
                <button
                  onClick={() => handleDayClick(day)}
                  disabled={isFuture(day)}
                  className={cn(
                    "h-9 w-9 rounded-full text-sm transition-all flex items-center justify-center",
                    "hover:bg-primary/10",
                    isSelected(day) && "bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-sm",
                    isToday(day) && !isSelected(day) && "ring-1 ring-primary/30 font-medium",
                    isFuture(day) && "text-muted-foreground/30 cursor-not-allowed hover:bg-transparent",
                    !isSelected(day) && !isFuture(day) && "text-foreground"
                  )}
                >
                  {day}
                </button>
              ) : (
                <div className="h-9 w-9" />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-3 py-2.5 border-t border-border/50">
          <Button size="sm" variant="ghost" className="rounded-lg" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" className="rounded-lg" onClick={onSave} disabled={!value}>
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
