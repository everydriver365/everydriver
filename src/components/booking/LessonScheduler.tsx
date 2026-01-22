import { useState, useEffect, useMemo, useCallback } from "react";
import { format, addDays, startOfDay, startOfMonth, isSameDay, isAfter, isBefore, parse } from "date-fns";
import { Calendar, Clock, X, Check, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { WaitlistDialog } from "./WaitlistDialog";

interface WorkingHour {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface DateOverride {
  override_date: string;
  override_end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  is_available: boolean;
}

interface ExternalCalendarEvent {
  start_time: string;
  end_time: string;
}

interface SelectedSlot {
  date: Date;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
}

interface LessonSchedulerProps {
  instructorId: string;
  totalHours: number;
  maxLessonLength: number;
  bookingAdvanceDays?: number;
  availableFrom?: string | null;
  allowedLessonLengths?: number[];
  pupilId?: string; // Optional - needed for waitlist functionality
  onSlotsChange: (slots: SelectedSlot[]) => void;
}

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7; // Start from 7 AM
  const minutes = i % 2 === 0 ? "00" : "30";
  if (hour > 20) return null; // End at 8 PM
  return `${hour.toString().padStart(2, "0")}:${minutes}`;
}).filter(Boolean) as string[];

// Default allowed lesson lengths (1-7 hours)
const DEFAULT_LESSON_LENGTHS = [60, 120, 180, 240, 300, 360, 420];

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} mins`;
  const hours = minutes / 60;
  if (hours === 1) return "1 hour";
  return `${hours} hours`;
};

export function LessonScheduler({
  instructorId,
  totalHours,
  maxLessonLength,
  bookingAdvanceDays = 28,
  availableFrom,
  allowedLessonLengths,
  pupilId,
  onSlotsChange,
}: LessonSchedulerProps) {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([]);
  const [externalEvents, setExternalEvents] = useState<ExternalCalendarEvent[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(true);
  const [viewMonth, setViewMonth] = useState(new Date());
  const [waitlistDialogOpen, setWaitlistDialogOpen] = useState(false);
  
  // Use allowed lesson lengths or default to 1-7 hours
  const durationOptions = useMemo(() => {
    const lengths = allowedLessonLengths && allowedLessonLengths.length > 0 
      ? allowedLessonLengths 
      : DEFAULT_LESSON_LENGTHS;
    return lengths.sort((a, b) => a - b);
  }, [allowedLessonLengths]);

  const [selectedDuration, setSelectedDuration] = useState(durationOptions[0] || 60);

  useEffect(() => {
    fetchAvailability();
  }, [instructorId]);

  // Navigate to the first available date's month when data loads
  useEffect(() => {
    if (!loading && workingHours.length > 0) {
      const today = startOfDay(new Date());
      const maxDate = addDays(today, bookingAdvanceDays);
      
      // Find the first available date
      let checkDate = today;
      
      // If availableFrom is set and in the future, start from there
      if (availableFrom) {
        const availableFromDate = parse(availableFrom, "yyyy-MM-dd", new Date());
        if (isAfter(availableFromDate, today)) {
          checkDate = availableFromDate;
        }
      }
      
      // Find first date with availability
      while (isBefore(checkDate, maxDate) || isSameDay(checkDate, maxDate)) {
        if (isDateAvailableCheck(checkDate)) {
          setViewMonth(startOfMonth(checkDate));
          break;
        }
        checkDate = addDays(checkDate, 1);
      }
    }
  }, [loading, workingHours, availableFrom, bookingAdvanceDays]);

  // Helper to check date availability without depending on isDateAvailable (avoids circular deps)
  const isDateAvailableCheck = useCallback((date: Date) => {
    const today = startOfDay(new Date());
    const maxDate = addDays(today, bookingAdvanceDays);
    
    if (isBefore(date, today) || isAfter(date, maxDate)) return false;
    
    if (availableFrom) {
      const availableFromDate = parse(availableFrom, "yyyy-MM-dd", new Date());
      if (isBefore(date, availableFromDate)) return false;
    }
    
    const dateStr = format(date, "yyyy-MM-dd");
    const dayOfWeek = date.getDay();

    // Check date overrides first
    const override = dateOverrides.find((o) => {
      const startDate = o.override_date;
      const endDate = o.override_end_date;
      
      if (endDate) {
        return dateStr >= startDate && dateStr <= endDate;
      }
      if (!endDate && dateStr >= startDate) {
        return true;
      }
      return dateStr === startDate;
    });

    if (override) {
      return override.is_available;
    }

    // Fall back to regular working hours
    const regularHours = workingHours.find((h) => h.day_of_week === dayOfWeek);
    return regularHours?.is_active || false;
  }, [workingHours, dateOverrides, availableFrom, bookingAdvanceDays]);

  useEffect(() => {
    onSlotsChange(selectedSlots);
  }, [selectedSlots, onSlotsChange]);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const { data: hours } = await supabase
        .from("instructor_working_hours")
        .select("*")
        .eq("instructor_id", instructorId);

      const todayStr = format(new Date(), "yyyy-MM-dd");
      const maxDateStr = format(addDays(new Date(), bookingAdvanceDays), "yyyy-MM-dd");

      const { data: overrides } = await supabase
        .from("instructor_date_overrides")
        .select("*")
        .eq("instructor_id", instructorId)
        // include overrides that still apply (either no end date, or end date not passed)
        .or(`override_end_date.gte.${todayStr},override_end_date.is.null`)
        // and only fetch overrides that could affect the currently bookable window
        .lte("override_date", maxDateStr);

      // Fetch external calendar events (Google Calendar busy times)
      const { data: calendarEvents } = await supabase
        .from("instructor_calendar_events")
        .select("start_time, end_time")
        .eq("instructor_id", instructorId)
        .eq("is_busy", true)
        .gte("start_time", todayStr);

      setWorkingHours(
        (hours || []).map((h) => ({
          day_of_week: h.day_of_week,
          start_time: h.start_time.slice(0, 5),
          end_time: h.end_time.slice(0, 5),
          is_active: h.is_active,
        }))
      );

      setDateOverrides(
        (overrides || []).map((o) => ({
          override_date: o.override_date,
          override_end_date: o.override_end_date,
          start_time: o.start_time?.slice(0, 5) || null,
          end_time: o.end_time?.slice(0, 5) || null,
          is_available: o.is_available,
        }))
      );

      setExternalEvents(
        (calendarEvents || []).map((e) => ({
          start_time: e.start_time,
          end_time: e.end_time,
        }))
      );
    } catch (error) {
      console.error("Error fetching availability:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayOfWeek = date.getDay();

    // Check date overrides first
    const override = dateOverrides.find((o) => {
      const startDate = o.override_date;
      const endDate = o.override_end_date;
      
      if (endDate) {
        return dateStr >= startDate && dateStr <= endDate;
      }
      // If no end date, check if it's a forever override (applies from start date onwards)
      if (!endDate && dateStr >= startDate) {
        return true;
      }
      return dateStr === startDate;
    });

    if (override) {
      if (!override.is_available) return null;
      return {
        startTime: override.start_time || "09:00",
        endTime: override.end_time || "17:00",
      };
    }

    // Fall back to regular working hours
    const regularHours = workingHours.find((h) => h.day_of_week === dayOfWeek);
    if (!regularHours?.is_active) return null;

    return {
      startTime: regularHours.start_time,
      endTime: regularHours.end_time,
    };
  };

  const isDateAvailable = (date: Date) => {
    const today = startOfDay(new Date());
    const maxDate = addDays(today, bookingAdvanceDays);
    
    if (isBefore(date, today) || isAfter(date, maxDate)) return false;
    
    // Check if instructor has an "available from" date set
    if (availableFrom) {
      const availableFromDate = parse(availableFrom, "yyyy-MM-dd", new Date());
      if (isBefore(date, availableFromDate)) return false;
    }
    
    // Only treat a day as available if it has at least one valid slot
    // (accounts for lesson duration, past times, selected slots, and external calendar conflicts)
    return getAvailableTimeSlots(date).length > 0;
  };

  const getAvailableTimeSlots = (date: Date) => {
    const availability = getAvailabilityForDate(date);
    if (!availability) return [];

    const { startTime, endTime } = availability;
    const slots: string[] = [];
    const dateStr = format(date, "yyyy-MM-dd");

    // Helper to check if a slot conflicts with external calendar events
    const conflictsWithExternalEvents = (slotStart: string, slotEnd: string) => {
      const slotStartDateTime = new Date(`${dateStr}T${slotStart}:00`);
      const slotEndDateTime = new Date(`${dateStr}T${slotEnd}:00`);

      return externalEvents.some((event) => {
        const eventStart = new Date(event.start_time);
        const eventEnd = new Date(event.end_time);
        
        // Check if the slot overlaps with the external event
        return (
          (slotStartDateTime >= eventStart && slotStartDateTime < eventEnd) ||
          (slotEndDateTime > eventStart && slotEndDateTime <= eventEnd) ||
          (slotStartDateTime < eventStart && slotEndDateTime > eventStart)
        );
      });
    };

    const now = new Date();
    const isToday = isSameDay(date, now);

    for (const time of TIME_SLOTS) {
      if (time >= startTime && time < endTime) {
        // Check if there's enough time for the selected lesson duration
        const slotEnd = addMinutesToTime(time, selectedDuration);
        if (slotEnd <= endTime) {
          // Skip slots in the past for today
          if (isToday) {
            const slotDateTime = new Date(`${dateStr}T${time}:00`);
            if (slotDateTime <= now) {
              continue;
            }
          }

          // Check if slot conflicts with already selected slots
          const conflictsWithSelected = selectedSlots.some(
            (s) =>
              isSameDay(s.date, date) &&
              ((time >= s.startTime && time < s.endTime) ||
                (slotEnd > s.startTime && slotEnd <= s.endTime) ||
                (time < s.startTime && slotEnd > s.startTime))
          );
          
          // Check if slot conflicts with external calendar events
          const conflictsWithExternal = conflictsWithExternalEvents(time, slotEnd);
          
          if (!conflictsWithSelected && !conflictsWithExternal) {
            slots.push(time);
          }
        }
      }
    }

    return slots;
  };

  const addMinutesToTime = (time: string, minutes: number) => {
    const [h, m] = time.split(":").map(Number);
    const totalMinutes = h * 60 + m + minutes;
    const newH = Math.floor(totalMinutes / 60);
    const newM = totalMinutes % 60;
    return `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`;
  };

  const scheduledHours = useMemo(() => {
    return selectedSlots.reduce((acc, slot) => acc + slot.duration / 60, 0);
  }, [selectedSlots]);

  const remainingHours = totalHours - scheduledHours;

  const handleSelectSlot = (date: Date, startTime: string) => {
    if (remainingHours <= 0) return;

    // Use the selected duration, but cap at remaining hours if needed
    const duration = Math.min(selectedDuration, remainingHours * 60);
    const endTime = addMinutesToTime(startTime, duration);

    setSelectedSlots((prev) => [
      ...prev,
      {
        date,
        startTime,
        endTime,
        duration,
      },
    ]);
    setSelectedDate(undefined);
  };

  const handleRemoveSlot = (index: number) => {
    setSelectedSlots((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="animate-pulse p-4 text-center text-muted-foreground">
        Loading availability...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Schedule Your Lessons
        </h3>
        <Badge variant={remainingHours > 0 ? "secondary" : "default"}>
          {scheduledHours}/{totalHours} hours scheduled
        </Badge>
      </div>

      {/* Lesson Length Selection - Made Prominent */}
      <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-medium text-foreground">
              Choose your lesson length
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Select how long each lesson should be for your {totalHours}-hour course
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {durationOptions.map((d) => {
              const hours = d / 60;
              const isSelected = selectedDuration === d;
              const colorClass = hours <= 1.5 
                ? "border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" 
                : hours <= 2.5 
                  ? "border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  : "border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100";
              return (
                <Button
                  key={d}
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDuration(d)}
                  className={cn(
                    "font-semibold transition-all",
                    isSelected 
                      ? `${colorClass} ring-2 ring-offset-2 ring-primary` 
                      : colorClass
                  )}
                >
                  {formatDuration(d)}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Calendar, Time Slots, and Selected Lessons */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Calendar */}
        <div className="rounded-lg border p-2">
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={viewMonth}
            onMonthChange={setViewMonth}
            disabled={(date) => !isDateAvailable(date)}
            modifiers={{
              booked: (date) =>
                selectedSlots.some((s) => isSameDay(s.date, date)),
              available: (date) => isDateAvailable(date) && !selectedSlots.some((s) => isSameDay(s.date, date)),
            }}
            modifiersStyles={{
              booked: {
                backgroundColor: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                fontWeight: "bold",
              },
              available: {
                backgroundColor: "hsl(var(--success) / 0.15)",
                color: "hsl(var(--success))",
                fontWeight: "600",
              },
            }}
            components={{
              DayContent: ({ date }) => {
                const isBooked = selectedSlots.some((s) => isSameDay(s.date, date));
                return (
                  <div className="relative flex items-center justify-center w-full h-full">
                    <span>{date.getDate()}</span>
                    {isBooked && (
                      <Check className="absolute bottom-0 right-0 h-3 w-3 text-white" strokeWidth={3} />
                    )}
                  </div>
                );
              },
            }}
            className={cn(
              "p-1 pointer-events-auto",
              "[&_table]:w-full",
              "[&_td]:p-0.5 [&_th]:p-0.5 [&_th]:text-xs [&_th]:font-medium",
              "[&_button]:h-9 [&_button]:w-9 [&_button]:text-sm [&_button]:rounded-none",
              "[&_.rdp-caption]:text-sm [&_.rdp-caption]:pb-2",
              "[&_.rdp-nav_button]:h-7 [&_.rdp-nav_button]:w-7"
            )}
          />
        </div>

        {/* Time Slots */}
        <div className="rounded-lg border p-3">
          {selectedDate ? (
            <div>
              <h4 className="font-medium mb-2 text-sm">
                Times for {format(selectedDate, "EEE, d MMM")}
              </h4>
              <div className="grid grid-cols-2 gap-1.5 max-h-[240px] overflow-y-auto">
                {getAvailableTimeSlots(selectedDate).map((time) => (
                  <Button
                    key={time}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectSlot(selectedDate, time)}
                    disabled={remainingHours <= 0}
                    className="text-xs h-8"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {time}
                  </Button>
                ))}
                {getAvailableTimeSlots(selectedDate).length === 0 && (
                  <div className="col-span-2 text-center py-4 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      No available slots for this date
                    </p>
                    {pupilId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWaitlistDialogOpen(true)}
                        className="gap-2"
                      >
                        <Bell className="h-4 w-4" />
                        Join Waitlist
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-xs py-8">
              Select a date to see times
            </div>
          )}
        </div>

        {/* Selected Lessons - Now in third column */}
        <div className="rounded-lg border p-3">
          <h4 className="font-medium mb-2 text-sm">Scheduled Lessons</h4>
          {selectedSlots.length > 0 ? (
            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {selectedSlots
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .map((slot, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="text-sm font-medium">
                        {format(slot.date, "EEE, d MMM")}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {slot.startTime} - {slot.endTime}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          ({slot.duration / 60}h)
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSlot(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm py-8">
              No lessons scheduled yet
            </div>
          )}
        </div>
      </div>

      {/* Remaining Hours Warning */}
      {remainingHours > 0 && selectedSlots.length > 0 && (
        <p className="text-sm text-warning">
          You still have {remainingHours} hours to schedule. Continue selecting
          dates and times above.
        </p>
      )}

      {remainingHours <= 0 && (
        <p className="text-sm text-success flex items-center gap-2">
          <Clock className="h-4 w-4" />
          All {totalHours} hours have been scheduled!
        </p>
      )}

      {/* Waitlist Dialog */}
      {pupilId && (
        <WaitlistDialog
          open={waitlistDialogOpen}
          onOpenChange={setWaitlistDialogOpen}
          instructorId={instructorId}
          pupilId={pupilId}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
}
