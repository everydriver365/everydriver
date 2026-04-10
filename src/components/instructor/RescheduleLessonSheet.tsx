import { useState, useEffect, useMemo } from "react";
import { format, addDays, startOfDay, startOfMonth, isSameDay, isAfter, isBefore, parse } from "date-fns";
import { Calendar, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

interface CalendarEvent {
  start_time: string;
  end_time: string;
}

interface ExistingLesson {
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
}

interface RescheduleLessonSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string;
  instructorId: string;
  pupilName: string;
  currentDate: string;
  currentTime: string;
  durationMinutes: number;
  onRescheduled: () => void;
}

const TIME_SLOTS = Array.from({ length: 26 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const minutes = i % 2 === 0 ? "00" : "30";
  if (hour > 20) return null;
  return `${hour.toString().padStart(2, "0")}:${minutes}`;
}).filter(Boolean) as string[];

export function RescheduleLessonSheet({
  open,
  onOpenChange,
  lessonId,
  instructorId,
  pupilName,
  currentDate,
  currentTime,
  durationMinutes,
  onRescheduled,
}: RescheduleLessonSheetProps) {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [existingLessons, setExistingLessons] = useState<ExistingLesson[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(new Date());

  const bookingAdvanceDays = 365;

  useEffect(() => {
    if (open) {
      setSelectedDate(undefined);
      setSelectedTime(null);
      fetchAvailability();
    }
  }, [open, instructorId]);

  const [bufferMinutes, setBufferMinutes] = useState(0);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const maxDateStr = format(addDays(new Date(), bookingAdvanceDays), "yyyy-MM-dd");

      const [hoursRes, overridesRes, calendarRes, lessonsRes, instructorRes] = await Promise.all([
        supabase
          .from("instructor_working_hours")
          .select("*")
          .eq("instructor_id", instructorId),
        supabase
          .from("instructor_date_overrides")
          .select("*")
          .eq("instructor_id", instructorId)
          .or(`override_end_date.gte.${todayStr},override_end_date.is.null`)
          .lte("override_date", maxDateStr),
        supabase
          .from("instructor_calendar_events")
          .select("start_time, end_time")
          .eq("instructor_id", instructorId)
          .eq("is_busy", true)
          .gte("start_time", todayStr),
        supabase
          .from("scheduled_lessons")
          .select("lesson_date, start_time, duration_minutes")
          .eq("instructor_id", instructorId)
          .neq("status", "cancelled")
          .neq("id", lessonId)
          .gte("lesson_date", todayStr),
        supabase
          .from("instructors")
          .select("buffer_minutes")
          .eq("id", instructorId)
          .single(),
      ]);

      setWorkingHours(
        (hoursRes.data || []).map((h) => ({
          day_of_week: h.day_of_week,
          start_time: h.start_time.slice(0, 5),
          end_time: h.end_time.slice(0, 5),
          is_active: h.is_active,
        }))
      );

      setDateOverrides(
        (overridesRes.data || []).map((o) => ({
          override_date: o.override_date,
          override_end_date: o.override_end_date,
          start_time: o.start_time?.slice(0, 5) || null,
          end_time: o.end_time?.slice(0, 5) || null,
          is_available: o.is_available,
        }))
      );

      setCalendarEvents(calendarRes.data || []);
      setExistingLessons(lessonsRes.data || []);
      setBufferMinutes(instructorRes.data?.buffer_minutes || 0);
    } catch (error) {
      console.error("Error fetching availability:", error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-select the first available date after loading
  useEffect(() => {
    if (!loading && !selectedDate && workingHours.length > 0) {
      const today = startOfDay(new Date());
      for (let i = 1; i <= bookingAdvanceDays; i++) {
        const candidate = addDays(today, i);
        if (isDateAvailable(candidate)) {
          setSelectedDate(candidate);
          setViewMonth(startOfMonth(candidate));
          break;
        }
      }
    }
  }, [loading, workingHours, dateOverrides, calendarEvents, existingLessons]);

  const getAvailabilityForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayOfWeek = date.getDay();

    const override = dateOverrides.find((o) => {
      const startDate = o.override_date;
      const endDate = o.override_end_date;
      if (endDate) return dateStr >= startDate && dateStr <= endDate;
      return dateStr === startDate;
    });

    if (override) {
      if (!override.is_available) return null;
      return {
        startTime: override.start_time || "09:00",
        endTime: override.end_time || "17:00",
      };
    }

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
    if (getAvailabilityForDate(date) === null) return false;
    return getAvailableTimeSlots(date).length > 0;
  };

  const addMinutesToTime = (time: string, minutes: number) => {
    const [h, m] = time.split(":").map(Number);
    const totalMinutes = h * 60 + m + minutes;
    const newH = Math.floor(totalMinutes / 60);
    const newM = totalMinutes % 60;
    return `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`;
  };

  const getAvailableTimeSlots = (date: Date) => {
    const availability = getAvailabilityForDate(date);
    if (!availability) return [];

    const { startTime, endTime } = availability;
    const dateStr = format(date, "yyyy-MM-dd");
    const slots: string[] = [];

    for (const time of TIME_SLOTS) {
      if (time >= startTime && time < endTime) {
        const slotEnd = addMinutesToTime(time, durationMinutes);
        if (slotEnd <= endTime) {
          // Check against existing lessons (with buffer)
          const conflictsWithLesson = existingLessons.some((l) => {
            if (l.lesson_date !== dateStr) return false;
            const lessonStart = addMinutesToTime(l.start_time.slice(0, 5), -bufferMinutes);
            const lessonEnd = addMinutesToTime(l.start_time.slice(0, 5), l.duration_minutes + bufferMinutes);
            return (
              (time >= lessonStart && time < lessonEnd) ||
              (slotEnd > lessonStart && slotEnd <= lessonEnd) ||
              (time < lessonStart && slotEnd > lessonStart)
            );
          });

          // Check against Google Calendar events (skip all-day events, with buffer)
          const conflictsWithCalendar = calendarEvents.some((e) => {
            const eventDate = e.start_time.slice(0, 10);
            if (eventDate !== dateStr) return false;
            const eventStart = e.start_time.slice(11, 16);
            const eventEnd = e.end_time.slice(11, 16);
            if (eventStart === "00:00" && (eventEnd === "23:59" || eventEnd === "00:00")) return false;
            const bufferedStart = addMinutesToTime(eventStart, -bufferMinutes);
            const bufferedEnd = addMinutesToTime(eventEnd, bufferMinutes);
            return (
              (time >= bufferedStart && time < bufferedEnd) ||
              (slotEnd > bufferedStart && slotEnd <= bufferedEnd) ||
              (time < bufferedStart && slotEnd > bufferedStart)
            );
          });

          if (!conflictsWithLesson && !conflictsWithCalendar) {
            slots.push(time);
          }
        }
      }
    }

    return slots;
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) return;

    setSaving(true);
    try {
      const newDateStr = format(selectedDate, "yyyy-MM-dd");
      
      const { error } = await supabase
        .from("scheduled_lessons")
        .update({
          lesson_date: newDateStr,
          start_time: selectedTime,
        })
        .eq("id", lessonId);

      if (error) throw error;

      // Notify instructor via SMS
      try {
        await supabase.functions.invoke("notify-instructor", {
          body: {
            instructorId,
            type: "reschedule",
            pupilName,
            lessonDate: newDateStr,
            lessonTime: selectedTime,
            oldDate: currentDate,
            oldTime: currentTime,
          },
        });
      } catch (smsError) {
        console.error("Failed to send reschedule SMS:", smsError);
      }

      toast({
        title: "Lesson rescheduled",
        description: `Moved to ${format(selectedDate, "EEE d MMM")} at ${selectedTime}`,
      });

      onRescheduled();
      onOpenChange(false);
    } catch (error) {
      console.error("Error rescheduling:", error);
      toast({
        title: "Error",
        description: "Failed to reschedule lesson",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const availableSlots = selectedDate ? getAvailableTimeSlots(selectedDate) : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Reschedule Lesson</SheetTitle>
          <SheetDescription>
            Move {pupilName}'s {durationMinutes}-minute lesson from {format(parse(currentDate, "yyyy-MM-dd", new Date()), "EEE d MMM")} at {currentTime.slice(0, 5)}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Calendar */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                Select New Date
              </h4>
              <div className="rounded-none border p-2">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  month={viewMonth}
                  onMonthChange={setViewMonth}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setSelectedTime(null);
                  }}
                  disabled={(date) => !isDateAvailable(date)}
                  modifiers={{
                    available: (date) => isDateAvailable(date),
                  }}
                  modifiersStyles={{
                    available: {
                      backgroundColor: "hsl(142 76% 90%)",
                      color: "hsl(142 76% 25%)",
                      fontWeight: "600",
                    },
                  }}
                  className="p-1 pointer-events-auto"
                />
              </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  Available Times for {format(selectedDate, "EEE d MMM")}
                </h4>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto touch-pan-y">
                  {availableSlots.length > 0 ? (
                    availableSlots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedTime(time);
                        }}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                          setSelectedTime(time);
                        }}
                        className="text-sm min-h-[44px] touch-manipulation active:scale-95 transition-transform"
                      >
                        {time}
                      </Button>
                    ))
                  ) : (
                    <p className="col-span-3 text-sm text-muted-foreground text-center py-4">
                      No available slots on this date
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Confirm Button */}
            <Button
              onClick={handleReschedule}
              disabled={!selectedDate || !selectedTime || saving}
              className="w-full"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm Reschedule
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
