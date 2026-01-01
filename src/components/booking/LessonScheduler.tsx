import { useState, useEffect, useMemo } from "react";
import { format, addDays, startOfDay, isSameDay, isAfter, isBefore, parse } from "date-fns";
import { Calendar, Clock, X } from "lucide-react";
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

interface SelectedSlot {
  date: Date;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
}

interface LessonSchedulerProps {
  instructorId: string;
  totalHours: number;
  maxLessonLength: number; // in minutes - maximum lesson duration allowed
  bookingAdvanceDays?: number;
  onSlotsChange: (slots: SelectedSlot[]) => void;
}

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7; // Start from 7 AM
  const minutes = i % 2 === 0 ? "00" : "30";
  if (hour > 20) return null; // End at 8 PM
  return `${hour.toString().padStart(2, "0")}:${minutes}`;
}).filter(Boolean) as string[];

// Generate duration options in 30-minute increments
const getDurationOptions = (maxMinutes: number) => {
  const options: number[] = [];
  for (let d = 30; d <= maxMinutes; d += 30) {
    options.push(d);
  }
  return options;
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
  onSlotsChange,
}: LessonSchedulerProps) {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(true);
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selectedDuration, setSelectedDuration] = useState(maxLessonLength || 60);

  const durationOptions = useMemo(() => getDurationOptions(maxLessonLength || 60), [maxLessonLength]);

  useEffect(() => {
    fetchAvailability();
  }, [instructorId]);

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
    
    return getAvailabilityForDate(date) !== null;
  };

  const getAvailableTimeSlots = (date: Date) => {
    const availability = getAvailabilityForDate(date);
    if (!availability) return [];

    const { startTime, endTime } = availability;
    const slots: string[] = [];

    for (const time of TIME_SLOTS) {
      if (time >= startTime && time < endTime) {
        // Check if there's enough time for the selected lesson duration
        const slotEnd = addMinutesToTime(time, selectedDuration);
        if (slotEnd <= endTime) {
          // Check if slot conflicts with already selected slots
          const conflicts = selectedSlots.some(
            (s) =>
              isSameDay(s.date, date) &&
              ((time >= s.startTime && time < s.endTime) ||
                (slotEnd > s.startTime && slotEnd <= s.endTime) ||
                (time < s.startTime && slotEnd > s.startTime))
          );
          if (!conflicts) {
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

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="text-sm text-muted-foreground">
          Select dates and times for your {totalHours}-hour course.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Lesson length:</span>
          <Select
            value={selectedDuration.toString()}
            onValueChange={(val) => setSelectedDuration(Number(val))}
          >
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {durationOptions.map((d) => (
                <SelectItem key={d} value={d.toString()}>
                  {formatDuration(d)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar and Time Slot Selection */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Calendar */}
        <div className="rounded-lg border p-4">
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
            }}
            modifiersStyles={{
              booked: {
                backgroundColor: "hsl(var(--primary))",
                color: "white",
                fontWeight: "bold",
              },
            }}
            className={cn("p-3 pointer-events-auto")}
          />
        </div>

        {/* Time Slots */}
        <div className="rounded-lg border p-4">
          {selectedDate ? (
            <div>
              <h4 className="font-medium mb-3">
                Available times for {format(selectedDate, "EEE, d MMM")}
              </h4>
              <div className="grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto">
                {getAvailableTimeSlots(selectedDate).map((time) => (
                  <Button
                    key={time}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectSlot(selectedDate, time)}
                    disabled={remainingHours <= 0}
                    className="text-sm"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {time}
                  </Button>
                ))}
                {getAvailableTimeSlots(selectedDate).length === 0 && (
                  <p className="col-span-3 text-sm text-muted-foreground py-4 text-center">
                    No available slots for this date
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Select a date to see available times
            </div>
          )}
        </div>
      </div>

      {/* Selected Lessons */}
      {selectedSlots.length > 0 && (
        <div className="rounded-lg border p-4">
          <h4 className="font-medium mb-3">Your Scheduled Lessons</h4>
          <div className="space-y-2">
            {selectedSlots
              .sort((a, b) => a.date.getTime() - b.date.getTime())
              .map((slot, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium">
                      {format(slot.date, "EEE, d MMM yyyy")}
                    </div>
                    <Badge variant="outline">
                      {slot.startTime} - {slot.endTime}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ({slot.duration / 60}h)
                    </span>
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
        </div>
      )}

      {/* Remaining Hours Warning */}
      {remainingHours > 0 && selectedSlots.length > 0 && (
        <p className="text-sm text-amber-600">
          You still have {remainingHours} hours to schedule. Continue selecting
          dates and times above.
        </p>
      )}

      {remainingHours <= 0 && (
        <p className="text-sm text-emerald-600 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          All {totalHours} hours have been scheduled!
        </p>
      )}
    </div>
  );
}
