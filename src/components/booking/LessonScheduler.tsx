import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { format, addDays, startOfDay, startOfMonth, addMonths, subMonths, isSameDay, isAfter, isBefore, parse } from "date-fns";
import { enGB } from "date-fns/locale";
import { CalendarDays, Clock, X, Check, Bell, Sparkles, ChevronLeft, ChevronRight, Plus, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { WaitlistDialog } from "./WaitlistDialog";
import { useGoogleCalendarRefresh } from "@/hooks/useGoogleCalendarRefresh";
import {
  TRAVEL_FALLBACK_MIN,
  loadCourseAvailabilitySources,
  computeDaySlots,
  type CourseAvailabilitySources,
  type InstructorLite,
} from "@/lib/courseAvailability";
import { fromMinutes } from "@/lib/availabilityEngine";

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
  pupilId?: string;
  instructorHomePostcode?: string;
  pupilPostcode?: string;
  instructorFirstName?: string;
  /** Date to open and pre-select on first load (typically from course search). */
  initialDate?: Date | null;
  onSlotsChange: (slots: SelectedSlot[]) => void;
  onConfirm?: () => void;
}

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const minutes = i % 2 === 0 ? "00" : "30";
  if (hour > 20) return null;
  return `${hour.toString().padStart(2, "0")}:${minutes}`;
}).filter(Boolean) as string[];

const DEFAULT_LESSON_LENGTHS = [60, 120, 180, 240, 300, 360, 420];

const formatLengthShort = (minutes: number) => {
  const hours = minutes / 60;
  if (Number.isInteger(hours)) return `${hours} hr`;
  return `${hours} hr`;
};

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
  instructorFirstName,
  initialDate,
  onSlotsChange,
  onConfirm,
}: LessonSchedulerProps) {
  
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
  const [candidatePickup, setCandidatePickup] = useState<{ lat: number; lng: number } | null>(null);
  // Unified availability sources — used by computeDaySlots (the single
  // engine-backed slot generator shared with /courses and create-booking).
  const [sources, setSources] = useState<CourseAvailabilitySources | null>(null);
  const [slotIncrementMinutes, setSlotIncrementMinutes] = useState<number>(30);
  
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

  // Pull the latest Google Calendar state into the cache before showing slots,
  // so date tiles and slot lists reflect events booked outside our app.
  // Throttled per (instructor, range) by sessionStorage TTL.
  useGoogleCalendarRefresh({
    instructorId,
    from: new Date(),
    to: addDays(new Date(), bookingAdvanceDays),
  });

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

  // Geocode pupil pickup postcode once so the engine can pad slots with
  // realistic travel time between every existing booked lesson and this one.
  useEffect(() => {
    let cancelled = false;
    if (!pupilPostcode) { setCandidatePickup(null); return; }
    import("@/lib/travelTime").then(({ geocodePostcode }) =>
      geocodePostcode(pupilPostcode).then((c) => { if (!cancelled) setCandidatePickup(c); })
    );
    return () => { cancelled = true; };
  }, [pupilPostcode]);

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

  // Re-fetch availability when the tab regains focus so a manual block,
  // Google Calendar event, or lesson added in the last few seconds can't
  // sneak past as a bookable slot.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchAvailability();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [instructorId, bookingAdvanceDays]);

  // Find the first date with at least one genuinely bookable slot — uses the
  // same logic as the slot picker so search & calendar agree.
  const findFirstBookableDate = useCallback((): Date | null => {
    const today = startOfDay(new Date());
    const maxDate = addDays(today, bookingAdvanceDays);
    let checkDate = today;
    if (availableFrom) {
      const availableFromDate = parse(availableFrom, "yyyy-MM-dd", new Date());
      if (isAfter(availableFromDate, today)) checkDate = availableFromDate;
    }
    while (isBefore(checkDate, maxDate) || isSameDay(checkDate, maxDate)) {
      if (isDateAvailable(checkDate)) return checkDate;
      checkDate = addDays(checkDate, 1);
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingAdvanceDays, availableFrom, workingHours, dateOverrides, externalEvents, selectedDuration, bufferMinutes, travelBufferMinutes]);

  // On first data load, honour the date passed in from search if it still has
  // slots; otherwise jump to the next genuinely bookable date.
  const initialJumpDoneRef = useRef(false);
  useEffect(() => {
    if (loading || workingHours.length === 0 || initialJumpDoneRef.current) return;
    if (initialDate && isDateAvailable(initialDate)) {
      setViewMonth(startOfMonth(initialDate));
      setSelectedDate(initialDate);
      initialJumpDoneRef.current = true;
      return;
    }
    const first = findFirstBookableDate();
    if (first) {
      setViewMonth(startOfMonth(first));
      setSelectedDate(first);
      initialJumpDoneRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, workingHours, externalEvents, selectedDuration]);

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
      const fromDate = new Date();
      const toDate = addDays(fromDate, bookingAdvanceDays);

      // Single shared loader — same RPCs used by /courses and create-booking
      // so we cannot disagree on what counts as "busy".
      const [src, prefRes, instrRes] = await Promise.all([
        loadCourseAvailabilitySources(supabase, [instructorId], fromDate, toDate),
        supabase
          .rpc("get_public_instructor_booking_preferences", { p_instructor_id: instructorId })
          .maybeSingle(),
        supabase
          .from("public_instructors")
          .select("slot_increment_minutes")
          .eq("id", instructorId)
          .maybeSingle(),
      ]);

      setSources(src);
      setPreferEarliestSlot((prefRes.data as any)?.prefer_earliest_slot ?? false);
      const inc = (instrRes.data as any)?.slot_increment_minutes;
      if (typeof inc === "number" && inc > 0) setSlotIncrementMinutes(inc);

      // Mirror to the legacy state arrays so day-tile rendering and
      // isDateAvailableCheck (which read these directly) keep working.
      setWorkingHours(
        (src.workingHours || []).map((h) => ({
          day_of_week: h.day_of_week,
          start_time: (h.start_time || "00:00").slice(0, 5),
          end_time: (h.end_time || "00:00").slice(0, 5),
          is_active: h.is_active,
        })),
      );
      setDateOverrides(
        (src.overrides || []).map((o) => ({
          override_date: o.override_date,
          override_end_date: o.override_end_date ?? null,
          start_time: o.start_time?.slice(0, 5) || null,
          end_time: o.end_time?.slice(0, 5) || null,
          is_available: o.is_available,
        })),
      );
      // Keep externalEvents in sync for any leftover consumers (e.g. callbacks
      // that pre-existed the unified path). Filtering happens inside the engine.
      setExternalEvents([
        ...src.calendarEvents.map((e) => ({ start_time: e.start_time, end_time: e.end_time })),
        ...src.manualBlocks.map((b) => ({ start_time: b.start_datetime, end_time: b.end_datetime })),
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

  // Unified slot generator — calls the engine via computeDaySlots, the SAME
  // path used by /courses discovery and the create-booking server guard.
  // Pupil-selected (not-yet-submitted) slots are folded into manual_blocks so
  // they block each other without going to the database.
  const getAvailableTimeSlots = (date: Date): string[] => {
    if (!sources) return [];

    const dateStr = format(date, "yyyy-MM-dd");
    const selectedAsBlocks = selectedSlots
      .filter((s) => isSameDay(s.date, date))
      .map((s) => ({
        instructor_id: instructorId,
        start_datetime: `${format(s.date, "yyyy-MM-dd")}T${s.startTime}:00`,
        end_datetime: `${format(s.date, "yyyy-MM-dd")}T${s.endTime}:00`,
      }));

    const srcWithSelected: CourseAvailabilitySources = {
      ...sources,
      manualBlocks: [...sources.manualBlocks, ...selectedAsBlocks],
    };

    const instructor: InstructorLite = {
      id: instructorId,
      available_from: availableFrom ?? null,
      buffer_minutes: bufferMinutes,
      is_network_placeholder: false,
    };

    // First-lesson travel buffer applies when the pupil postcode lookup
    // produced a travel estimate larger than the back-to-back buffer.
    const firstLessonBuffer = Math.max(travelBufferMinutes ?? 0, TRAVEL_FALLBACK_MIN);

    const { slots } = computeDaySlots(instructor, date, srcWithSelected, {
      durationMinutes: selectedDuration,
      bufferMinutes,
      firstLessonBufferMinutes: firstLessonBuffer,
      slotIncrementMinutes,
    });

    void dateStr; // (retained name for clarity)
    return slots.map((s) => fromMinutes(s.start));
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

  // Group slots by time of day (must be above any early return to keep hook order stable)
  const slotsForSelectedDate = selectedDate && !loading ? getAvailableTimeSlots(selectedDate) : [];
  const grouped = useMemo(() => {
    const m: string[] = [];
    const a: string[] = [];
    const e: string[] = [];
    for (const t of slotsForSelectedDate) {
      const h = parseInt(t.slice(0, 2), 10);
      if (h < 12) m.push(t);
      else if (h < 17) a.push(t);
      else e.push(t);
    }
    return { morning: m, afternoon: a, evening: e };
  }, [slotsForSelectedDate]);

  const sortedSlots = useMemo(
    () => [...selectedSlots].sort((a, b) => {
      const t = a.date.getTime() - b.date.getTime();
      return t !== 0 ? t : a.startTime.localeCompare(b.startTime);
    }),
    [selectedSlots]
  );

  if (loading) {
    return (
      <div className="animate-pulse p-4 text-center text-muted-foreground">
        Loading availability...
      </div>
    );
  }


  const progressPct = Math.min(100, Math.round((scheduledHours / totalHours) * 100));
  const remainingHoursDisplay = Math.max(0, remainingHours);

  const renderSlotGroup = (label: string, items: string[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1">
        <div className="text-[10px] font-semibold tracking-[1px] text-muted-foreground">
          {label}
        </div>
        <div className="flex flex-col gap-1">
          {items.map((time) => {
            const end = addMinutesToTime(time, selectedDuration);
            return (
              <button
                key={time}
                type="button"
                onClick={() => selectedDate && handleSelectSlot(selectedDate, time)}
                disabled={remainingHours <= 0}
                className={cn(
                  "group flex w-full items-center justify-between rounded-md border border-border/70 bg-card px-3 py-2 text-left transition-colors",
                  "hover:border-primary hover:bg-muted/40",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border/70 disabled:hover:bg-card"
                )}
              >
                <span className="text-[12px] font-semibold text-foreground">
                  {time} – {end}
                </span>
                <Plus className="h-3.5 w-3.5 text-emerald-600 group-hover:text-emerald-700" strokeWidth={2.5} />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="rounded-[12px] border bg-card px-[22px] py-[18px] shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-primary/10 text-primary shrink-0">
              <CalendarPlus className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[16px] font-bold leading-tight text-foreground">
                Schedule your lessons
              </h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Pick a date, then tap a time. Mix lengths and dates as you go.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1.5 min-w-[180px]">
            <div className="text-[12px] text-muted-foreground">
              <span className="text-[15px] font-bold text-primary">{scheduledHours}</span>
              <span className="text-foreground/80">/{totalHours} hours booked</span>
            </div>
            <div className="h-2 w-full sm:w-[200px] rounded-full bg-primary/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Course-can't-fit warning */}
      {!courseCanBeCompleted && (
        <div className="rounded-[12px] border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-sm text-destructive font-medium">
            This {totalHours}-hour course can't be evenly divided into the instructor's allowed lengths
            ({baseDurationOptions.map(d => formatDuration(d)).join(', ')}). Please contact the instructor.
          </p>
        </div>
      )}

      {/* Two-column grid: workspace + sticky lessons list */}
      <div className="grid gap-4 lg:grid-cols-[3fr_2fr] items-start">
        {/* Workspace card */}
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-[18px] shadow-sm">
          {/* Toolbar */}
          <div className="mb-3 pb-3 border-b border-[#E5E7EB] flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setViewMonth((m) => subMonths(m, 1))}
                className="flex h-[28px] w-[28px] items-center justify-center rounded-md border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#0A2B6B] transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="px-2 text-[16px] font-bold text-[#0A2B6B] tabular-nums">
                {format(viewMonth, "MMMM yyyy")}
              </div>
              <button
                type="button"
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
                className="flex h-[28px] w-[28px] items-center justify-center rounded-md border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#0A2B6B] transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-[#F0F4FB] p-[3px]">
              {durationOptions.map((d) => {
                const isSelected = selectedDuration === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDuration(d)}
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors",
                      isSelected
                        ? "bg-[#0A2B6B] text-white shadow-sm"
                        : "text-[#6B7280] hover:text-[#0A2B6B]"
                    )}
                  >
                    {formatLengthShort(d)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inner two-column: calendar + slots */}
          <div className="grid gap-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            {/* Calendar */}
            <div>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={viewMonth}
                onMonthChange={setViewMonth}
                disabled={(date) => !isDateAvailable(date)}
                weekStartsOn={1}
                locale={enGB}
                formatters={{ formatWeekdayName: (d) => format(d, "EEEEEE", { locale: enGB }) }}
                modifiers={{
                  hasLesson: (date) => selectedSlots.some((s) => isSameDay(s.date, date)),
                  available: (date) =>
                    isDateAvailable(date) && !selectedSlots.some((s) => isSameDay(s.date, date)),
                }}
                modifiersClassNames={{
                  available:
                    "!bg-[#E8F5EE] !text-[#0F6E56] !font-semibold hover:!bg-[#DCEFE3] cursor-pointer",
                  hasLesson:
                    "!bg-[#F0F4FB] !text-[#0A2B6B] !font-semibold relative after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-[2px] after:h-1 after:w-1 after:rounded-full after:bg-[#0A2B6B]",
                }}
                classNames={{
                  caption: "hidden",
                  nav: "hidden",
                  months: "w-full",
                  month: "w-full space-y-2",
                  table: "w-full border-collapse",
                  head_row: "grid grid-cols-7 gap-1.5 mb-1",
                  head_cell:
                    "text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF] text-center",
                  row: "grid grid-cols-7 gap-1.5 mt-1.5",
                  cell: "p-0 text-sm relative",
                  day: "w-full h-[30px] flex items-center justify-center rounded-lg text-[13px] font-medium text-[#D1D5DB] cursor-default transition-colors",
                  day_selected:
                    "!bg-[#0A2B6B] !text-white !font-semibold hover:!bg-[#0A2B6B]",
                  day_disabled:
                    "!text-[#D1D5DB] !bg-transparent !font-normal cursor-default hover:!bg-transparent",
                  day_outside: "!text-[#E5E7EB]",
                  day_today: "ring-1 ring-[#0A2B6B]/30",
                }}
                className="p-0 w-full pointer-events-auto"
              />
              {/* Legend */}
              <div className="mt-3 pt-3 border-t border-[#E5E7EB] flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-[3px] bg-[#E8F5EE] border border-[#0F6E56]/20" />
                  <span className="text-[10px] text-[#6B7280]">Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="relative h-2.5 w-2.5 rounded-[3px] bg-[#F0F4FB]">
                    <span className="absolute left-1/2 -translate-x-1/2 bottom-[1px] h-1 w-1 rounded-full bg-[#0A2B6B]" />
                  </span>
                  <span className="text-[10px] text-[#6B7280]">Has lesson</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-[3px] bg-[#0A2B6B]" />
                  <span className="text-[10px] text-[#6B7280]">Selected</span>
                </div>
              </div>
            </div>

            {/* Slots */}
            <div className="md:border-l md:border-[#E5E7EB] md:border-t-0 border-t border-[#E5E7EB] md:pl-[14px] md:pt-0 pt-[14px]">
              {selectedDate ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-[13px] font-bold text-[#0A2B6B]">
                      {format(selectedDate, "EEE d MMMM")}
                    </div>
                    <div className="text-[11px] text-[#6B7280] mt-0.5">
                      {formatLengthShort(selectedDuration)} slots
                      {pupilPostcode ? ` · Pickup ${pupilPostcode}` : ""}
                    </div>
                  </div>
                  {slotsForSelectedDate.length === 0 ? (
                    <div className="py-6 text-center space-y-3">
                      <Clock className="h-6 w-6 mx-auto text-[#D1D5DB]" />
                      <p className="text-[12px] text-[#6B7280]">
                        No {formatLengthShort(selectedDuration)} slots available on this date
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const next = findFirstBookableDate();
                          if (next) {
                            setViewMonth(startOfMonth(next));
                            setSelectedDate(next);
                          }
                        }}
                        className="gap-2"
                      >
                        <CalendarDays className="h-4 w-4" />
                        Jump to next available date
                      </Button>
                      {pupilId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setWaitlistDialogOpen(true)}
                          className="gap-2"
                        >
                          <Bell className="h-4 w-4" />
                          Join waitlist
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-[10px]">
                      {renderSlotGroup("MORNING", grouped.morning)}
                      {renderSlotGroup("AFTERNOON", grouped.afternoon)}
                      {renderSlotGroup("EVENING", grouped.evening)}
                    </div>
                  )}
                  {preferEarliestSlot && slotsForSelectedDate.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] text-[#6B7280] pt-1">
                      <Sparkles className="h-3 w-3 text-[#0A2B6B]" />
                      Earliest slots prioritised by your instructor
                    </div>
                  )}
                </div>
              ) : (
                <div className="pt-6 flex flex-col items-center text-center px-4">
                  <CalendarDays className="h-7 w-7 text-[#D1D5DB] mb-2" />
                  <p className="text-[13px] text-[#6B7280]">
                    Click any available date to see times
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scheduled lessons (sticky on desktop) */}
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm lg:sticky lg:top-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[14px] font-bold text-[#0A2B6B]">Your lessons</h4>
            <span className="text-[12px] text-[#6B7280]">
              {selectedSlots.length} booked · {scheduledHours} hr
            </span>
          </div>

          {selectedSlots.length > 0 ? (
            <div className="max-h-[320px] overflow-y-auto pr-1 -mr-1">
              {sortedSlots.map((slot, index) => {
                const originalIndex = selectedSlots.indexOf(slot);
                return (
                  <div
                    key={`${slot.date.getTime()}-${slot.startTime}`}
                    className="flex items-center gap-[10px] rounded-lg bg-[#F9FAFB] p-2.5 mb-1.5 last:mb-0"
                  >
                    <div className="flex h-[22px] w-[22px] items-center justify-center rounded-md bg-[#0A2B6B] text-white text-[11px] font-bold shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold text-[#0A2B6B] truncate">
                        {format(slot.date, "EEE d MMM")} · {slot.startTime}
                      </div>
                      <div className="text-[10px] text-[#6B7280] truncate">
                        {slot.duration / 60} hr{instructorFirstName ? ` · ${instructorFirstName}` : ""}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(originalIndex)}
                      className="text-[#9CA3AF] hover:text-[#E63946] transition-colors p-1 -m-1"
                      aria-label="Remove lesson"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center space-y-2">
              <CalendarDays className="h-7 w-7 mx-auto text-[#D1D5DB]" />
              <p className="text-[12px] text-[#6B7280] px-2">
                Click any date to schedule your first lesson
              </p>
            </div>
          )}

          {/* Confirm button */}
          <div className="mt-4 space-y-1.5">
            <Button
              type="button"
              onClick={() => onConfirm?.()}
              disabled={remainingHours > 0}
              className="w-full"
            >
              {remainingHours > 0
                ? `Book ${remainingHoursDisplay} more ${remainingHoursDisplay === 1 ? "hour" : "hours"} to continue`
                : "All lessons booked, proceed to payment"}
            </Button>
            <p className="text-[11px] text-[#6B7280] text-center">
              Edit any lesson before confirming
            </p>
          </div>
        </div>
      </div>

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
