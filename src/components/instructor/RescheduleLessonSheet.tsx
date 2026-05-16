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
import { checkLessonClash, describeLessonClashError } from "@/lib/lessonClashCheck";
import { useGoogleCalendarRefresh } from "@/hooks/useGoogleCalendarRefresh";
import {
  loadCourseAvailabilitySources,
  computeDaySlots,
  type InstructorLite,
  type CourseAvailabilitySources,
} from "@/lib/courseAvailability";
import { fromMinutes } from "@/lib/availabilityEngine";

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
  const [instructor, setInstructor] = useState<InstructorLite | null>(null);
  const [sources, setSources] = useState<CourseAvailabilitySources | null>(null);
  const [slotIncrement, setSlotIncrement] = useState<number>(60);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, instructorId]);

  // Refresh Google Calendar cache for the reschedule horizon when the sheet opens.
  useGoogleCalendarRefresh({
    instructorId,
    from: new Date(),
    to: addDays(new Date(), bookingAdvanceDays),
    enabled: open,
  });

  const fetchAvailability = async () => {
    setLoading(true);
    setError(null);
    try {
      const fromDate = startOfDay(new Date());
      const toDate = addDays(fromDate, bookingAdvanceDays);

      const [instructorRes, loadedSources] = await Promise.all([
        supabase
          .from("instructors")
          .select("id, available_from, buffer_minutes, slot_increment_minutes, is_network_placeholder")
          .eq("id", instructorId)
          .maybeSingle(),
        loadCourseAvailabilitySources(supabase, [instructorId], fromDate, toDate),
      ]);

      const row = (instructorRes.data || { id: instructorId }) as any;
      setInstructor({
        id: instructorId,
        available_from: row.available_from ?? null,
        buffer_minutes: row.buffer_minutes ?? 0,
        is_network_placeholder: row.is_network_placeholder ?? false,
      });
      setSlotIncrement(row.slot_increment_minutes ?? 60);
      setBufferMinutes(row.buffer_minutes ?? 0);
      setSources(loadedSources);
    } catch (err) {
      console.error("Error fetching availability:", err);
      setError("Couldn't load availability. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getAvailableTimeSlots = (date: Date): string[] => {
    if (!instructor || !sources) return [];
    const today = startOfDay(new Date());
    const maxDate = addDays(today, bookingAdvanceDays);
    if (isBefore(date, today) || isAfter(date, maxDate)) return [];
    const { slots } = computeDaySlots(instructor, date, sources, {
      durationMinutes,
      bufferMinutes,
      slotIncrementMinutes: slotIncrement,
    });
    return slots.map((s) => fromMinutes(s.start));
  };

  const isDateAvailable = (date: Date) => getAvailableTimeSlots(date).length > 0;

  // Auto-select the first available date after loading
  useEffect(() => {
    if (!loading && !selectedDate && instructor && sources) {
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
  }, [loading, instructor, sources]);

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) return;

    setSaving(true);
    try {
      const newDateStr = format(selectedDate, "yyyy-MM-dd");

      // Final clash check immediately before the write — slots can become
      // stale between rendering and the user clicking "Reschedule".
      const clash = await checkLessonClash({
        instructorId,
        date: newDateStr,
        startTime: selectedTime,
        durationMinutes,
        bufferMinutes,
        excludeLessonId: lessonId,
      });
      if (clash.hardOverlap) {
        toast({
          title: "That slot is already booked",
          description: clash.message ?? "Please pick another time.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      const { error: updateErr } = await supabase
        .from("scheduled_lessons")
        .update({
          lesson_date: newDateStr,
          start_time: selectedTime,
        })
        .eq("id", lessonId);

      if (updateErr) {
        const friendly = describeLessonClashError(updateErr);
        if (friendly) {
          toast({ title: "Clash detected", description: friendly, variant: "destructive" });
          setSaving(false);
          return;
        }
        throw updateErr;
      }

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
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#3D55A1" }} />
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
                    <ChevronLeft size={14} color="#3D55A1" />
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
                    <ChevronRight size={14} color="#3D55A1" />
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
                      bg = "#3D55A1";
                      color = "#FFFFFF";
                      weight = 700;
                    } else if (isOriginal && inMonth) {
                      color = "#C7C7CC";
                      textDecoration = "line-through";
                    } else if (available && inMonth) {
                      bg = "#EEF3FF";
                      color = "#3D55A1";
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
                  <LegendItem dot="#3D55A1" label="Selected" />
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
                          style={{ ...baseStyle, background: "#3D55A1" }}
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
                  style={{ background: notifyPupil ? "#3D55A1" : "#E0E5EE" }}
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
                  <Clock size={14} color="#3D55A1" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#3D55A1", marginBottom: 2 }}>
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
                  background: selectedDate && selectedTime && !saving ? "#3D55A1" : "#C7C7CC",
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
