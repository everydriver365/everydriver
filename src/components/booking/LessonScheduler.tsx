import { useState, useEffect, useMemo, useCallback } from "react";
import { format, addDays, startOfDay, startOfMonth, isSameDay, isAfter, isBefore, parse } from "date-fns";
import { Calendar, Clock, X, Check, Bell, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
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
  bufferMinutes?: number;
  pupilId?: string; // Optional - needed for waitlist functionality
  instructorHomePostcode?: string;
  pupilPostcode?: string;
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
  bufferMinutes = 0,
  pupilId,
  instructorHomePostcode,
  pupilPostcode,
  onSlotsChange,
}: LessonSchedulerProps) {
  const isMobile = useIsMobile();
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([]);
  const [externalEvents, setExternalEvents] = useState<ExternalCalendarEvent[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(true);
  const [viewMonth, setViewMonth] = useState(new Date());
  const [waitlistDialogOpen, setWaitlistDialogOpen] = useState(false);
  const [preferEarliestSlot, setPreferEarliestSlot] = useState(false);
  const [travelBufferMinutes, setTravelBufferMinutes] = useState<number | null>(null);
  
  // Base allowed lesson lengths from instructor settings
  const baseDurationOptions = useMemo(() => {
    const lengths = allowedLessonLengths && allowedLessonLengths.length > 0 
      ? allowedLessonLengths 
      : DEFAULT_LESSON_LENGTHS;
    return lengths.sort((a, b) => a - b);
  }, [allowedLessonLengths]);

  const [selectedDuration, setSelectedDuration] = useState(baseDurationOptions[0] || 60);

  useEffect(() => {
    fetchAvailability();
  }, [instructorId]);

  // Fetch travel time from instructor home to pupil postcode
  useEffect(() => {
    if (!instructorHomePostcode || !pupilPostcode) {
      setTravelBufferMinutes(null);
      return;
    }
    const fetchTravelTime = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("check-travel-buffer", {
          body: {
            from_postcode: instructorHomePostcode,
            to_postcode: pupilPostcode,
          },
        });
        if (!error && data?.travel_minutes != null) {
          setTravelBufferMinutes(data.travel_minutes);
        } else {
          setTravelBufferMinutes(null);
        }
      } catch {
        setTravelBufferMinutes(null);
      }
    };
    fetchTravelTime();
  }, [instructorHomePostcode, pupilPostcode]);

  // Effective buffer for first-of-day slots: max(travel, buffer)
  const effectiveFirstSlotBuffer = useMemo(() => {
    return Math.max(travelBufferMinutes ?? 0, bufferMinutes);
  }, [travelBufferMinutes, bufferMinutes]);

  // Real-time subscription: refetch when new lessons are booked
  useEffect(() => {
    const channel = supabase
      .channel('booking-slot-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scheduled_lessons',
          filter: `instructor_id=eq.${instructorId}`,
        },
        () => {
          fetchAvailability();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        // Date range override - check if date falls within range
        return dateStr >= startDate && dateStr <= endDate;
      }
      // Single date override - only match exact date
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
      const today = format(new Date(), "yyyy-MM-dd");
      const maxDate = format(addDays(new Date(), bookingAdvanceDays), "yyyy-MM-dd");
      const [hoursRes, overridesRes, calendarRes, prefRes, lessonsRes] = await Promise.all([
        supabase
          .from("instructor_working_hours")
          .select("*")
          .eq("instructor_id", instructorId),
        supabase
          .from("instructor_date_overrides")
          .select("*")
          .eq("instructor_id", instructorId)
          .or(`override_end_date.gte.${today},override_end_date.is.null`)
          .lte("override_date", maxDate),
        supabase
          .from("instructor_calendar_events")
          .select("start_time, end_time")
          .eq("instructor_id", instructorId)
          .eq("is_busy", true)
          .gte("start_time", today),
        // Public-safe RPC — works for anonymous booking visitors.
        supabase
          .rpc("get_public_instructor_booking_preferences", { p_instructor_id: instructorId })
          .maybeSingle(),
        // Public-safe RPC — exposes only date/start/duration, no pupil data.
        supabase.rpc("get_public_scheduled_lesson_blocks", {
          p_instructor_ids: [instructorId],
          p_from_date: today,
          p_to_date: maxDate,
        }),
      ]);

      const hours = hoursRes.data;
      const overrides = overridesRes.data;
      const calendarEvents = calendarRes.data;
      const existingLessons = lessonsRes.data;

      setPreferEarliestSlot((prefRes.data as any)?.prefer_earliest_slot ?? false);

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

      // Convert existing scheduled_lessons into the same shape as external calendar events
      // so they block pupil-facing slots via the same conflict logic.
      const lessonEvents = (existingLessons || []).map((l: any) => {
        const startIso = `${l.lesson_date}T${(l.start_time || '00:00:00').slice(0, 8)}`;
        const startD = new Date(startIso);
        const endD = new Date(startD.getTime() + (l.duration_minutes || 60) * 60_000);
        return { start_time: startD.toISOString(), end_time: endD.toISOString() };
      });

      setExternalEvents([
        ...(calendarEvents || []).map((e) => ({
          start_time: e.start_time,
          end_time: e.end_time,
        })),
        ...lessonEvents,
      ]);
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
        // Date range override - check if date falls within range
        return dateStr >= startDate && dateStr <= endDate;
      }
      // Single date override - only match exact date
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

      const bufferMs = bufferMinutes * 60 * 1000;
      return externalEvents.some((event) => {
        const eventStart = new Date(event.start_time);
        const eventEnd = new Date(event.end_time);
        
        // Skip all-day events (duration >= 24 hours — informational, not time-specific blocks)
        const diffMs = eventEnd.getTime() - eventStart.getTime();
        if (diffMs >= 24 * 60 * 60 * 1000) return false;
        
        // Expand conflict zone by buffer
        const bufferedStart = new Date(eventStart.getTime() - bufferMs);
        const bufferedEnd = new Date(eventEnd.getTime() + bufferMs);
        
        return (
          (slotStartDateTime >= bufferedStart && slotStartDateTime < bufferedEnd) ||
          (slotEndDateTime > bufferedStart && slotEndDateTime <= bufferedEnd) ||
          (slotStartDateTime < bufferedStart && slotEndDateTime > bufferedStart)
        );
      });
    };

    const now = new Date();
    const isToday = isSameDay(date, now);

    // Determine the earliest existing event/lesson on this day to check if slot is "first of day"
    const daySelectedSlots = selectedSlots
      .filter(s => isSameDay(s.date, date))
      .map(s => s.startTime)
      .sort();
    const dayExternalStarts = externalEvents
      .filter(e => {
        const evDate = new Date(e.start_time);
        const evEnd = new Date(e.end_time);
        if (evEnd.getTime() - evDate.getTime() >= 24 * 60 * 60 * 1000) return false;
        return format(evDate, "yyyy-MM-dd") === dateStr;
      })
      .map(e => format(new Date(e.start_time), "HH:mm"))
      .sort();
    const hasExistingEvents = daySelectedSlots.length > 0 || dayExternalStarts.length > 0;

    // The earliest time the instructor can start if coming from home
    const travelAdjustedStart = effectiveFirstSlotBuffer > 0
      ? addMinutesToTime(startTime, effectiveFirstSlotBuffer)
      : startTime;

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

          // For first-of-day slots, apply travel buffer: slot must start after travelAdjustedStart
          // A slot is "first of day" if no existing events precede it
          const isFirstOfDay = !hasExistingEvents || (
            daySelectedSlots.every(s => s >= time) && dayExternalStarts.every(s => s >= time)
          );
          if (isFirstOfDay && effectiveFirstSlotBuffer > bufferMinutes && time < travelAdjustedStart) {
            continue;
          }

          // Check if slot conflicts with already selected slots (with buffer)
          const conflictsWithSelected = selectedSlots.some(
            (s) => {
              if (!isSameDay(s.date, date)) return false;
              const bufferedStart = addMinutesToTime(s.startTime, -bufferMinutes);
              const bufferedEnd = addMinutesToTime(s.endTime, bufferMinutes);
              return (
                (time >= bufferedStart && time < bufferedEnd) ||
                (slotEnd > bufferedStart && slotEnd <= bufferedEnd) ||
                (time < bufferedStart && slotEnd > bufferedStart)
              );
            }
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
  const remainingMinutes = remainingHours * 60;

  // Check if a given remaining time can be filled exactly by allowed lesson lengths
  const canFillRemainder = useCallback((remaining: number): boolean => {
    if (remaining === 0) return true;
    if (remaining < 0) return false;
    return baseDurationOptions.some(d => d <= remaining && canFillRemainder(remaining - d));
  }, [baseDurationOptions]);

  // Upfront validation: can the total course hours be divided by instructor's allowed lengths?
  const courseCanBeCompleted = useMemo(() => {
    return canFillRemainder(totalHours * 60);
  }, [canFillRemainder, totalHours]);

  // Smart duration filtering: only show instructor-allowed lengths that won't create orphan remainders
  const durationOptions = useMemo(() => {
    if (remainingMinutes <= 0) return baseDurationOptions;

    const minAllowed = Math.min(...baseDurationOptions);

    // Filter to durations that fit within remaining time
    const fitting = baseDurationOptions.filter(d => d <= remainingMinutes);

    // Only keep durations where the leftover can be filled by allowed lengths
    const smart = fitting.filter(d => canFillRemainder(remainingMinutes - d));

    if (smart.length > 0) return smart;

    // Fallback: if no combination works, only offer the exact remainder if it meets instructor minimum
    if (fitting.length === 0 && remainingMinutes >= minAllowed) {
      return [remainingMinutes];
    }

    // If remainder is below instructor minimum, no valid options — show fitting (will be empty if truly stuck)
    return fitting;
  }, [baseDurationOptions, remainingMinutes, canFillRemainder]);

  // Check if we're showing a non-standard completion duration (only if ≥ instructor minimum)
  const completionDuration = useMemo(() => {
    if (remainingMinutes <= 0) return null;
    const minAllowed = Math.min(...baseDurationOptions);
    const isNonStandard = durationOptions.includes(remainingMinutes) && !baseDurationOptions.includes(remainingMinutes);
    return isNonStandard && remainingMinutes >= minAllowed ? remainingMinutes : null;
  }, [durationOptions, baseDurationOptions, remainingMinutes]);

  // Auto-select valid duration when current selection becomes invalid
  useEffect(() => {
    if (durationOptions.length > 0 && !durationOptions.includes(selectedDuration)) {
      // Pick the closest valid option
      const closest = durationOptions.reduce((prev, curr) =>
        Math.abs(curr - selectedDuration) < Math.abs(prev - selectedDuration) ? curr : prev
      );
      setSelectedDuration(closest);
    }
  }, [durationOptions, selectedDuration]);

  const handleSelectSlot = (date: Date, startTime: string) => {
    if (remainingHours <= 0) return;

    // Duration is always valid since we only show valid options
    const duration = selectedDuration;
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
    // Keep the date selected so users can pick multiple slots on the same day
    // Only clear if no more hours remaining after this selection
    const newRemainingHours = remainingHours - (duration / 60);
    if (newRemainingHours <= 0) {
      setSelectedDate(undefined);
    }
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

      {/* Warning if course can't be divided by instructor's allowed lengths */}
      {!courseCanBeCompleted && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-sm text-destructive font-medium">
            ⚠️ This {totalHours}-hour course cannot be evenly divided into the instructor's allowed lesson lengths ({baseDurationOptions.map(d => formatDuration(d)).join(', ')}). Please contact the instructor to adjust the course hours or lesson length options.
          </p>
        </div>
      )}

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
                  {completionDuration === d && (
                    <span className="ml-1 text-[10px] opacity-75">(finish)</span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
        {completionDuration && (
          <p className="text-xs text-muted-foreground mt-2 px-1">
            💡 A {formatDuration(completionDuration)} lesson has been added to complete your {totalHours}-hour course (instructor allows {baseDurationOptions.map(d => formatDuration(d)).join(', ')} lessons)
          </p>
        )}
      </div>

      {/* Calendar, Time Slots, and Selected Lessons */}
      {isMobile ? (
        /* ── Mobile Layout: Calendar + Chips + Bottom Sheet ── */
        <div className="relative">
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
                DayContent: (props: { date: Date }) => {
                  const isBooked = selectedSlots.some((s) => isSameDay(s.date, props.date));
                  return (
                    <div className="relative flex items-center justify-center w-full h-full">
                      <span>{props.date.getDate()}</span>
                      {isBooked && (
                        <Check className="absolute bottom-0 right-0 h-3 w-3 text-white pointer-events-none" strokeWidth={3} />
                      )}
                    </div>
                  );
                },
              }}
              className={cn(
                "p-1 pointer-events-auto",
                "[&_table]:w-full",
                "[&_td]:p-0.5 [&_th]:p-0.5 [&_th]:text-xs [&_th]:font-medium",
                "[&_button]:h-9 [&_button]:w-9 [&_button]:text-sm [&_button]:rounded-2xl",
                "[&_.rdp-caption]:text-sm [&_.rdp-caption]:pb-2",
                "[&_.rdp-nav_button]:h-7 [&_.rdp-nav_button]:w-7"
              )}
            />
          </div>

          {/* Compact Scheduled Lesson Chips */}
          {selectedSlots.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selectedSlots
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .map((slot, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="pl-2 pr-1 py-1 text-xs gap-1 cursor-pointer"
                    onClick={() => handleRemoveSlot(index)}
                  >
                    {format(slot.date, "EEE d")} {slot.startTime} · {slot.duration / 60}h
                    <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </Badge>
                ))}
            </div>
          )}

          {/* Bottom Sheet Time Picker */}
          <AnimatePresence>
            {selectedDate && (
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="mt-3 rounded-xl border-2 border-primary/20 bg-card shadow-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">
                    {format(selectedDate, "EEE, d MMM")}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setSelectedDate(undefined)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(() => {
                    const slots = getAvailableTimeSlots(selectedDate);
                    return slots.map((time, idx) => (
                    <Button
                      key={time}
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectSlot(selectedDate, time);
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        handleSelectSlot(selectedDate, time);
                      }}
                      disabled={remainingHours <= 0}
                      className={cn(
                        "text-xs h-10 min-h-[44px] active:scale-95 transition-transform touch-manipulation",
                        preferEarliestSlot && idx === 0 && "border-primary bg-primary/10 ring-1 ring-primary"
                      )}
                    >
                      {preferEarliestSlot && idx === 0 && <Sparkles className="h-3 w-3 mr-1 text-primary pointer-events-none" />}
                      {!(preferEarliestSlot && idx === 0) && <Clock className="h-3 w-3 mr-1 pointer-events-none" />}
                      {time}
                    </Button>
                    ));
                  })()}
                  {getAvailableTimeSlots(selectedDate).length === 0 && (
                    <div className="col-span-3 text-center py-4 space-y-3">
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* ── Desktop Layout: 3-column grid ── */
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
                DayContent: (props: { date: Date }) => {
                  const isBooked = selectedSlots.some((s) => isSameDay(s.date, props.date));
                  return (
                    <div className="relative flex items-center justify-center w-full h-full">
                      <span>{props.date.getDate()}</span>
                      {isBooked && (
                        <Check className="absolute bottom-0 right-0 h-3 w-3 text-white pointer-events-none" strokeWidth={3} />
                      )}
                    </div>
                  );
                },
              }}
              className={cn(
                "p-1 pointer-events-auto",
                "[&_table]:w-full",
                "[&_td]:p-0.5 [&_th]:p-0.5 [&_th]:text-xs [&_th]:font-medium",
                "[&_button]:h-9 [&_button]:w-9 [&_button]:text-sm [&_button]:rounded-2xl",
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
                <div className="grid grid-cols-2 gap-1.5 max-h-[240px] overflow-y-auto touch-pan-y">
                  {(() => {
                    const slots = getAvailableTimeSlots(selectedDate);
                    return slots.map((time, idx) => (
                    <Button
                      key={time}
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectSlot(selectedDate, time);
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        handleSelectSlot(selectedDate, time);
                      }}
                      disabled={remainingHours <= 0}
                      className={cn(
                        "text-xs h-10 min-h-[44px] active:scale-95 transition-transform touch-manipulation",
                        preferEarliestSlot && idx === 0 && "border-primary bg-primary/10 ring-1 ring-primary"
                      )}
                    >
                      {preferEarliestSlot && idx === 0 && <Sparkles className="h-3 w-3 mr-1 text-primary pointer-events-none" />}
                      {!(preferEarliestSlot && idx === 0) && <Clock className="h-3 w-3 mr-1 pointer-events-none" />}
                      {time}
                    </Button>
                    ));
                  })()}
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

          {/* Selected Lessons */}
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
      )}

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
