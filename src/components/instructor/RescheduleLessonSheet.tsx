import { useState, useEffect, useMemo } from "react";
import { format, addDays, startOfDay, startOfMonth, endOfMonth, addMonths, subMonths, isSameDay, isSameMonth, isAfter, isBefore, parse } from "date-fns";
import { Clock, Loader2, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

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
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(new Date());
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [notifyPupil, setNotifyPupil] = useState(true);

  const bookingAdvanceDays = 365;

  useEffect(() => {
    if (open) {
      setSelectedDate(undefined);
      setSelectedTime(null);
      setError(null);
      fetchAvailability();
    }
  }, [open, instructorId]);

  const fetchAvailability = async () => {
    setLoading(true);
    setError(null);
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
    } catch (err) {
      console.error("Error fetching availability:", err);
      setError("Couldn't load availability. Please try again.");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      const { error: updateErr } = await supabase
        .from("scheduled_lessons")
        .update({
          lesson_date: newDateStr,
          start_time: selectedTime,
        })
        .eq("id", lessonId);

      if (updateErr) throw updateErr;

      if (notifyPupil) {
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
      }

      toast({
        title: "Lesson rescheduled",
        description: `Moved to ${format(selectedDate, "EEE d MMM")} at ${selectedTime}`,
      });

      onRescheduled();
      onOpenChange(false);
    } catch (err) {
      console.error("Error rescheduling:", err);
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
  const currentDateObj = useMemo(() => parse(currentDate, "yyyy-MM-dd", new Date()), [currentDate]);
  const initials = getInitials(pupilName);
  const firstName = pupilName.split(/\s+/)[0] || pupilName;

  // Build calendar grid for the viewMonth
  const calendarCells = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const firstDayOfWeek = monthStart.getDay();
    const gridStart = addDays(monthStart, -firstDayOfWeek);
    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) cells.push(addDays(gridStart, i));
    // Trim to last full week containing month end
    const lastIdx = cells.findIndex((d) => isSameDay(d, monthEnd));
    const trimmed = cells.slice(0, Math.ceil((lastIdx + 1) / 7) * 7);
    return trimmed;
  }, [viewMonth]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 border-0 [&>button]:hidden"
        style={{ background: "#F2F4F8" }}
      >
        {/* Header */}
        <div
          style={{
            background: "#FFFFFF",
            borderBottom: "0.5px solid #F0F3F8",
            padding: "16px 18px 14px",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "#F2F4F8",
                border: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={14} color="#5B6B8A" strokeWidth={2.2} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: "#B23A3F",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: "#FFF" }}>{initials}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A" }}>{pupilName}</span>
          </div>

          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#1A1A1A",
              letterSpacing: -0.3,
              margin: 0,
            }}
          >
            Reschedule lesson
          </h2>

          <div
            style={{
              display: "inline-flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: "#FFF0F0",
              borderRadius: 20,
              padding: "5px 11px",
              marginTop: 8,
            }}
          >
            <Clock size={11} color="#B23A3F" />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#B23A3F" }}>
              {format(currentDateObj, "EEE")} {format(currentDateObj, "d MMM")} · {currentTime.slice(0, 5)} · {durationMinutes} min
            </span>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "14px 16px", paddingBottom: 28 }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#0A0F29" }} />
            </div>
          ) : (
            <>
              {/* Section 1: Select new date */}
              <SectionLabel>SELECT NEW DATE</SectionLabel>
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: 18,
                  padding: "14px 12px",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setViewMonth((m) => subMonths(m, 1))}
                    style={navBtnStyle}
                    aria-label="Previous month"
                  >
                    <ChevronLeft size={14} color="#0A0F29" />
                  </button>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A" }}>
                    {format(viewMonth, "MMMM yyyy")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setViewMonth((m) => addMonths(m, 1))}
                    style={navBtnStyle}
                    aria-label="Next month"
                  >
                    <ChevronRight size={14} color="#0A0F29" />
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
                  {DAY_LABELS.map((d) => (
                    <div
                      key={d}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#8E8E93",
                        textAlign: "center",
                        padding: "4px 0",
                      }}
                    >
                      {d}
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                  {calendarCells.map((d, i) => {
                    const inMonth = isSameMonth(d, viewMonth);
                    const isOriginal = isSameDay(d, currentDateObj);
                    const isSelected = selectedDate && isSameDay(d, selectedDate);
                    const available = isDateAvailable(d);
                    const today = startOfDay(new Date());
                    const isPast = isBefore(d, today);

                    let bg = "transparent";
                    let color = "#C7C7CC";
                    let weight: number = 400;
                    let textDecoration: string | undefined;

                    if (isSelected) {
                      bg = "#0A0F29";
                      color = "#FFFFFF";
                      weight = 700;
                    } else if (isOriginal && inMonth) {
                      color = "#C7C7CC";
                      textDecoration = "line-through";
                    } else if (available && inMonth) {
                      bg = "#EEF3FF";
                      color = "#0A0F29";
                      weight = 600;
                    } else if (inMonth && !isPast) {
                      color = "#C7C7CC";
                    }

                    const clickable = available && !isOriginal;

                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "2px 0",
                        }}
                      >
                        <button
                          type="button"
                          disabled={!clickable}
                          onClick={() => {
                            if (!clickable) return;
                            setSelectedDate(d);
                            setSelectedTime(null);
                          }}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 15,
                            background: bg,
                            color,
                            fontSize: 12,
                            fontWeight: weight,
                            border: 0,
                            cursor: clickable ? "pointer" : "default",
                            textDecoration,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                          }}
                        >
                          {d.getDate()}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 14,
                    alignItems: "center",
                    marginTop: 12,
                    paddingTop: 10,
                    borderTop: "0.5px solid #F0F3F8",
                  }}
                >
                  <LegendItem dot="#0A0F29" label="Selected" />
                  <LegendItem dot="#EEF3FF" dotBorder="#C8D8F0" label="Available" />
                  <LegendItem dot="#F2F4F8" label="Unavailable" />
                </div>
              </div>

              {/* Section 2: Available times */}
              <SectionLabel>
                AVAILABLE TIMES{selectedDate ? ` · ${format(selectedDate, "EEE d MMM")}` : ""}
              </SectionLabel>

              {error ? (
                <div
                  style={{
                    background: "#FFF0F0",
                    color: "#B23A3F",
                    borderRadius: 14,
                    padding: 12,
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 12,
                  }}
                >
                  {error}
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 7,
                    marginBottom: 12,
                  }}
                >
                  {selectedDate && availableSlots.length === 0 && (
                    <div
                      style={{
                        gridColumn: "1 / -1",
                        background: "#FFFFFF",
                        borderRadius: 12,
                        padding: 16,
                        textAlign: "center",
                        fontSize: 12,
                        color: "#8E8E93",
                      }}
                    >
                      No available slots on this date
                    </div>
                  )}
                  {availableSlots.map((time) => {
                    const isSelected = selectedTime === time;
                    const baseStyle: React.CSSProperties = {
                      borderRadius: 12,
                      padding: 10,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      cursor: "pointer",
                      border: 0,
                      width: "100%",
                    };
                    if (isSelected) {
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedTime(time)}
                          style={{ ...baseStyle, background: "#0A0F29" }}
                        >
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#FFF" }}>{time}</span>
                          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
                            {(durationMinutes / 60).toFixed(durationMinutes % 60 ? 1 : 0)}h slot
                          </span>
                        </button>
                      );
                    }
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        style={{
                          ...baseStyle,
                          background: "#FFFFFF",
                          border: "0.5px solid rgba(26,82,160,0.15)",
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A" }}>{time}</span>
                        <span style={{ fontSize: 9, color: "#8E8E93", marginTop: 2 }}>
                          {(durationMinutes / 60).toFixed(durationMinutes % 60 ? 1 : 0)}h slot
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Section 3: Notify pupil toggle */}
              <div
                style={{
                  background: "#FFF",
                  borderRadius: 14,
                  padding: 12,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>
                    Notify {firstName}
                  </div>
                  <div style={{ fontSize: 11, color: "#8E8E93", marginTop: 1 }}>
                    Send SMS confirmation
                  </div>
                </div>
                <Switch
                  checked={notifyPupil}
                  onCheckedChange={setNotifyPupil}
                  style={{ background: notifyPupil ? "#0A0F29" : "#E0E5EE" }}
                />
              </div>

              {/* Section 4: Summary card */}
              {selectedDate && selectedTime && (
                <div
                  style={{
                    background: "#EEF3FF",
                    borderRadius: 14,
                    padding: 12,
                    display: "flex",
                    flexDirection: "row",
                    gap: 10,
                    alignItems: "flex-start",
                    marginBottom: 14,
                  }}
                >
                  <Clock size={14} color="#0A0F29" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#0A0F29", marginBottom: 2 }}>
                      New lesson time
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>
                      {format(selectedDate, "EEE")} {format(selectedDate, "d MMM")} · {selectedTime} · {durationMinutes} min
                    </div>
                  </div>
                </div>
              )}

              {/* Section 5: Footer actions */}
              <button
                type="button"
                onClick={handleReschedule}
                disabled={!selectedDate || !selectedTime || saving}
                style={{
                  background: selectedDate && selectedTime && !saving ? "#0A0F29" : "#C7C7CC",
                  borderRadius: 14,
                  padding: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginBottom: 8,
                  width: "100%",
                  border: 0,
                  cursor: selectedDate && selectedTime && !saving ? "pointer" : "default",
                }}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" color="#FFF" /> : null}
                <span style={{ fontSize: 14, fontWeight: 700, color: "#FFF" }}>
                  Confirm reschedule
                </span>
              </button>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                style={{
                  padding: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: "#B23A3F" }}>
                  Keep original lesson
                </span>
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

const navBtnStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 15,
  background: "#F2F4F8",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: 0,
  cursor: "pointer",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10, padding: "0 2px" }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "#8E8E93",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {children}
      </span>
    </div>
  );
}

function LegendItem({ dot, dotBorder, label }: { dot: string; dotBorder?: string; label: string }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          background: dot,
          border: dotBorder ? `0.5px solid ${dotBorder}` : "none",
          display: "inline-block",
        }}
      />
      <span style={{ fontSize: 10, color: "#5B6B8A", fontWeight: 600 }}>{label}</span>
    </div>
  );
}
