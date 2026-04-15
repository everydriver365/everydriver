import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format, addDays, isToday, parseISO, startOfDay, endOfDay, isSameDay } from "date-fns";
import { Calendar, Clock, MapPin, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScheduleDayTabs } from "./ScheduleDayTabs";
import { ExpandableLessonCard } from "./ExpandableLessonCard";
import { RescheduleLessonSheet } from "./RescheduleLessonSheet";
import { CancelLessonDialog } from "./CancelLessonDialog";
import { AddLessonSheet } from "./AddLessonSheet";
import { TravelTimeIndicator } from "./TravelTimeIndicator";
import { PupilAvatar } from "./PupilAvatar";
import { LessonCheckInBadge } from "./LessonCheckInBadge";
import { useLessonTravelTimes } from "@/hooks/useLessonTravelTimes";
import { triggerAutomations } from "@/utils/triggerAutomations";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ScheduledLesson {
  id: string;
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
  lesson_type: string;
  pickup_location: string | null;
  pickup_postcode: string | null;
  status: string;
  payment_status: string;
  prepaid_hours_used: number;
  amount_due: number;
  notes: string | null;
  check_in_status?: string;
  pupil: {
    id: string;
    name: string;
    phone: string | null;
    address: string;
    postcode: string;
    prepaid_hours: number;
    account_balance: number;
    profile_image_url: string | null;
  };
}

interface ExternalEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  color: string | null;
  is_all_day: boolean;
}

interface ManualBlock {
  id: string;
  title: string;
  start_datetime: string;
  end_datetime: string;
  block_type: string;
  notes: string | null;
}

interface MultiDayScheduleViewProps {
  instructorId: string;
}

const DAYS_TO_LOAD = 14;

const courseTypeLabels: Record<string, string> = {
  standard: "Standard", test_prep: "Test Prep", mock_test: "Mock Test",
  motorway: "Motorway", refresher: "Refresher", intensive: "Intensive",
  first_lesson: "First Lesson", pass_plus: "Pass Plus", driving_test: "Driving Test",
};

const formatTime = (timeStr: string) => {
  const [h, m] = timeStr.split(":");
  return `${h}:${m}`;
};

const getEndTime = (startTime: string, durationMinutes: number) => {
  const [h, m] = startTime.split(":").map(Number);
  const endMin = h * 60 + m + durationMinutes;
  return `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
};

// Determine if text should be white or dark on a given bg color
function contrastText(hex: string | null): string {
  if (!hex) return "text-white";
  const c = hex.replace("#", "");
  if (c.length < 6) return "text-white";
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "text-gray-900" : "text-white";
}

// Default block colors
const blockTypeColors: Record<string, string> = {
  personal: "#1e3a5f",
  break: "#f59e0b",
  meeting: "#8b5cf6",
};

// Lesson type colors (for the bar background)
const lessonTypeBarColors: Record<string, string> = {
  standard: "#3b82f6",
  test_prep: "#f59e0b",
  mock_test: "#f43f5e",
  motorway: "#10b981",
  refresher: "#06b6d4",
  intensive: "#8b5cf6",
  first_lesson: "#22c55e",
  pass_plus: "#6366f1",
  driving_test: "#f97316",
};

export function MultiDayScheduleView({ instructorId }: MultiDayScheduleViewProps) {
  const navigate = useNavigate();
  const todayRef = useRef<HTMLDivElement>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [lessons, setLessons] = useState<ScheduledLesson[]>([]);
  const [externalEvents, setExternalEvents] = useState<ExternalEvent[]>([]);
  const [manualBlocks, setManualBlocks] = useState<ManualBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [addLessonOpen, setAddLessonOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<ScheduledLesson | null>(null);
  const [sendingMessage, setSendingMessage] = useState<string | null>(null);

  // Date range: from today, load DAYS_TO_LOAD days
  const startDate = useMemo(() => startOfDay(new Date()), []);
  const days = useMemo(() => Array.from({ length: DAYS_TO_LOAD }, (_, i) => addDays(startDate, i)), [startDate]);

  // Fetch all data for the range
  const fetchData = useCallback(async () => {
    setLoading(true);
    const from = format(startDate, "yyyy-MM-dd");
    const to = format(addDays(startDate, DAYS_TO_LOAD - 1), "yyyy-MM-dd");
    const fromISO = startOfDay(startDate).toISOString();
    const toISO = endOfDay(addDays(startDate, DAYS_TO_LOAD - 1)).toISOString();

    try {
      const [lessonsRes, externalRes, blocksRes] = await Promise.all([
        supabase
          .from("scheduled_lessons")
          .select(`
            id, lesson_date, start_time, duration_minutes, lesson_type,
            pickup_location, pickup_postcode, status, payment_status,
            prepaid_hours_used, amount_due, notes, check_in_status,
            pupil:pupils(id, name, phone, address, postcode, prepaid_hours, account_balance, profile_image_url)
          `)
          .eq("instructor_id", instructorId)
          .neq("status", "cancelled")
          .gte("lesson_date", from)
          .lte("lesson_date", to)
          .order("start_time", { ascending: true }),
        supabase
          .from("instructor_calendar_events")
          .select("id, title, start_time, end_time, color")
          .eq("instructor_id", instructorId)
          .gte("start_time", fromISO)
          .lte("start_time", toISO),
        supabase
          .from("instructor_manual_blocks")
          .select("id, title, start_datetime, end_datetime, block_type, notes")
          .eq("instructor_id", instructorId)
          .gte("start_datetime", fromISO)
          .lte("start_datetime", toISO),
      ]);

      const transformedLessons = (lessonsRes.data || []).map((l: any) => ({
        ...l,
        pupil: l.pupil || { id: "", name: "Unknown", phone: null, address: "", postcode: "", prepaid_hours: 0, account_balance: 0, profile_image_url: null },
      }));
      setLessons(transformedLessons);

      const events: ExternalEvent[] = (externalRes.data || []).map((evt: any) => {
        const start = parseISO(evt.start_time);
        const end = parseISO(evt.end_time);
        const startHour = start.getHours() + start.getMinutes();
        const endHour = end.getHours();
        const isAllDay = startHour === 0 && (endHour === 23 || endHour === 0);
        return { id: evt.id, title: evt.title || "Busy", start_time: evt.start_time, end_time: evt.end_time, color: evt.color, is_all_day: isAllDay };
      });
      setExternalEvents(events);
      setManualBlocks(blocksRes.data || []);
    } catch (e) {
      console.error("Error fetching schedule data:", e);
    } finally {
      setLoading(false);
    }
  }, [instructorId, startDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Scroll to today on mount
  useEffect(() => {
    if (!loading && todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading]);

  // --- Handlers (same as NewMobileScheduleView) ---
  const handleNavigate = (address: string, postcode: string) => {
    const query = encodeURIComponent(`${address}, ${postcode}`);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isIOS ? `maps://maps.apple.com/?daddr=${query}` : `geo:0,0?q=${query}`;
    const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
    window.location.href = url;
    setTimeout(() => { window.open(fallbackUrl, "_blank"); }, 500);
  };
  const handleCall = (phone: string | null) => {
    if (!phone) { toast({ title: "No phone number", variant: "destructive" }); return; }
    window.location.href = `tel:${phone}`;
  };
  const handleText = (phone: string | null) => {
    if (!phone) { toast({ title: "No phone number", variant: "destructive" }); return; }
    window.location.href = `sms:${phone}`;
  };
  const handleOnWay = async (lesson: ScheduledLesson, delayMinutes?: number) => {
    if (!lesson.pupil?.phone) { toast({ title: "No phone number", variant: "destructive" }); return; }
    setSendingMessage(lesson.id);
    const firstName = (lesson.pupil?.name || "").split(" ")[0];
    let message: string;
    if (delayMinutes === -1) message = `Hi ${firstName}, I'll call you as soon as I can!`;
    else if (delayMinutes === -2) message = `Hi ${firstName}, I'm on my way to you now!`;
    else if (delayMinutes) message = `Hi ${firstName}, I'm on my way! I'll be with you in about ${delayMinutes} minutes.`;
    else message = `Hi ${firstName}, I'm on my way to you!`;
    window.location.href = `sms:${lesson.pupil.phone}?body=${encodeURIComponent(message)}`;
    setSendingMessage(null);
  };
  const handleCancelLesson = (lesson: ScheduledLesson) => { setSelectedLesson(lesson); setCancelDialogOpen(true); };
  const handleRescheduleLesson = (lesson: ScheduledLesson) => { setSelectedLesson(lesson); setRescheduleDialogOpen(true); };
  const handleDeleteLesson = (lesson: ScheduledLesson) => { setSelectedLesson(lesson); setCancelDialogOpen(true); };
  const handleNoShow = async (lesson: ScheduledLesson) => {
    try {
      await supabase.from("scheduled_lessons").update({ status: "no_show" as any, marked_no_show_at: new Date().toISOString() } as any).eq("id", lesson.id);
      try {
        const { data: prefs } = await supabase.from("instructor_reminder_preferences").select("no_show_fee, auto_charge_no_show").eq("instructor_id", instructorId).maybeSingle();
        if (prefs?.auto_charge_no_show && prefs.no_show_fee > 0) {
          const newBalance = (lesson.pupil?.account_balance || 0) - prefs.no_show_fee;
          await supabase.from("pupils").update({ account_balance: newBalance }).eq("id", lesson.pupil.id);
          await supabase.from("payment_history").insert({ pupil_id: lesson.pupil.id, instructor_id: instructorId, amount: -prefs.no_show_fee, payment_method: "No-Show Fee", notes: `No-show charge for ${lesson.lesson_date} ${lesson.start_time}` });
        }
      } catch (e) { console.error("No-show fee error:", e); }
      triggerAutomations({ triggerType: "no_show", instructorId, pupilId: lesson.pupil.id, pupilName: lesson.pupil.name });
      toast({ title: "Marked as no-show" });
      fetchData();
    } catch (e) {
      console.error("No-show error:", e);
      toast({ title: "Error", variant: "destructive" });
    }
  };

  // Group data by day
  const dayData = useMemo(() => {
    return days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayLessons = lessons.filter((l) => l.lesson_date === dateStr);
      const dayExternal = externalEvents.filter((e) => {
        const evtDate = e.start_time.slice(0, 10);
        return evtDate === dateStr;
      });
      const dayBlocks = manualBlocks.filter((b) => {
        const blockDate = b.start_datetime.slice(0, 10);
        return blockDate === dateStr;
      });

      // Merge all events into a single sorted timeline
      type TimelineItem =
        | { kind: "lesson"; time: string; data: ScheduledLesson }
        | { kind: "external"; time: string; data: ExternalEvent }
        | { kind: "block"; time: string; data: ManualBlock };

      const timeline: TimelineItem[] = [];
      dayLessons.forEach((l) => timeline.push({ kind: "lesson", time: l.start_time, data: l }));
      dayExternal.filter((e) => !e.is_all_day).forEach((e) => {
        const t = format(parseISO(e.start_time), "HH:mm");
        timeline.push({ kind: "external", time: t, data: e });
      });
      dayBlocks.forEach((b) => {
        const t = format(parseISO(b.start_datetime), "HH:mm");
        timeline.push({ kind: "block", time: t, data: b });
      });
      timeline.sort((a, b) => a.time.localeCompare(b.time));

      const allDay = dayExternal.filter((e) => e.is_all_day);

      return { day, dateStr, timeline, allDay, lessonCount: dayLessons.length };
    });
  }, [days, lessons, externalEvents, manualBlocks]);

  if (loading) {
    return (
      <div className="space-y-4">
        <ScheduleDayTabs selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Week strip */}
      <ScheduleDayTabs selectedDate={selectedDate} onSelectDate={(d) => {
        setSelectedDate(d);
        // Scroll to that day
        const el = document.getElementById(`schedule-day-${format(d, "yyyy-MM-dd")}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }} />

      {/* Add lesson button */}
      <div className="flex justify-end px-1">
        <Button
          onClick={() => setAddLessonOpen(true)}
          size="sm"
          className="rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white gap-1.5 h-9 px-4 shadow-md"
        >
          <Plus className="h-4 w-4" />
          Add Lesson
        </Button>
      </div>

      {/* Multi-day list */}
      <div className="divide-y divide-border/40">
        {dayData.map(({ day, dateStr, timeline, allDay }) => {
          const today = isToday(day);
          const isEmpty = timeline.length === 0 && allDay.length === 0;

          return (
            <div
              key={dateStr}
              id={`schedule-day-${dateStr}`}
              ref={today ? todayRef : undefined}
              className="flex min-h-[72px]"
            >
              {/* Date column */}
              <div className="w-14 shrink-0 flex flex-col items-center pt-3 pb-2">
                <span className={`text-[11px] font-semibold uppercase tracking-wide ${today ? "text-[#1a73e8]" : "text-muted-foreground"}`}>
                  {format(day, "EEE")}
                </span>
                <div className={`mt-0.5 w-9 h-9 flex items-center justify-center rounded-full text-[17px] font-bold ${
                  today
                    ? "bg-[#1a73e8] text-white"
                    : "text-foreground"
                }`}>
                  {format(day, "d")}
                </div>
              </div>

              {/* Events column */}
              <div className="flex-1 py-2 pr-3 space-y-1.5 min-w-0">
                {/* All-day events */}
                {allDay.map((evt) => (
                  <div
                    key={evt.id}
                    className="rounded-lg px-3 py-2 text-[13px] font-semibold"
                    style={{ backgroundColor: evt.color || "#039be5" }}
                  >
                    <span className={contrastText(evt.color || "#039be5")}>{evt.title}</span>
                  </div>
                ))}

                {/* Timeline items */}
                {timeline.map((item) => {
                  if (item.kind === "lesson") {
                    const lesson = item.data;
                    const barColor = lessonTypeBarColors[lesson.lesson_type] || "#3b82f6";
                    const paid = lesson.payment_status === "paid";

                    return (
                      <ExpandableLessonCard
                        key={lesson.id}
                        lesson={lesson}
                        onNavigate={handleNavigate}
                        onCall={handleCall}
                        onText={handleText}
                        onOnWay={handleOnWay}
                        onCancel={handleCancelLesson}
                        onReschedule={handleRescheduleLesson}
                        onNoShow={handleNoShow}
                        sendingMessage={sendingMessage}
                        onDelete={handleDeleteLesson}
                        renderCustomCollapsed={
                          <div
                            className="rounded-lg px-3 py-2.5 space-y-0.5"
                            style={{ backgroundColor: barColor }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[13px] font-bold text-white truncate">
                                {lesson.pupil?.name || "Unknown"}
                              </span>
                              {!paid && (
                                <span className="text-[10px] font-semibold bg-white/25 text-white rounded px-1.5 py-0.5">
                                  Unpaid
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-white/90 text-[12px]">
                              <span>{formatTime(lesson.start_time)} – {getEndTime(lesson.start_time, lesson.duration_minutes)}</span>
                              <span className="text-white/60">·</span>
                              <span>{courseTypeLabels[lesson.lesson_type] || lesson.lesson_type}</span>
                            </div>
                            {(lesson.pickup_location || lesson.pupil?.address) && (
                              <div className="flex items-center gap-1 text-white/75 text-[11px]">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">{lesson.pickup_location || lesson.pupil?.address}</span>
                              </div>
                            )}
                          </div>
                        }
                      />
                    );
                  }

                  if (item.kind === "external") {
                    const evt = item.data;
                    const startDt = parseISO(evt.start_time);
                    const endDt = parseISO(evt.end_time);
                    const bgColor = evt.color || "#039be5";
                    return (
                      <div
                        key={evt.id}
                        className="rounded-lg px-3 py-2.5 space-y-0.5"
                        style={{ backgroundColor: bgColor }}
                      >
                        <span className={`text-[13px] font-bold ${contrastText(bgColor)}`}>
                          {evt.title}
                        </span>
                        <div className={`text-[12px] ${contrastText(bgColor)} opacity-80`}>
                          {format(startDt, "HH:mm")} – {format(endDt, "HH:mm")}
                        </div>
                      </div>
                    );
                  }

                  if (item.kind === "block") {
                    const block = item.data;
                    const startDt = parseISO(block.start_datetime);
                    const endDt = parseISO(block.end_datetime);
                    const bgColor = blockTypeColors[block.block_type] || "#6b7280";
                    return (
                      <div
                        key={block.id}
                        className="rounded-lg px-3 py-2.5 space-y-0.5"
                        style={{ backgroundColor: bgColor }}
                      >
                        <span className={`text-[13px] font-bold ${contrastText(bgColor)}`}>
                          {block.title}
                        </span>
                        <div className={`text-[12px] ${contrastText(bgColor)} opacity-80`}>
                          {format(startDt, "HH:mm")} – {format(endDt, "HH:mm")}
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}

                {/* Empty state */}
                {isEmpty && (
                  <div className="flex items-center h-12 text-[13px] text-muted-foreground/50 italic pl-1">
                    No events
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cancel Dialog */}
      {selectedLesson && (
        <CancelLessonDialog
          open={cancelDialogOpen}
          onOpenChange={(open) => { setCancelDialogOpen(open); if (!open) setSelectedLesson(null); }}
          lessonId={selectedLesson.id}
          pupilId={selectedLesson.pupil?.id || ""}
          pupilName={selectedLesson.pupil?.name || "Unknown"}
          amountDue={selectedLesson.amount_due || 0}
          pupilBalance={selectedLesson.pupil?.account_balance || 0}
          durationMinutes={selectedLesson.duration_minutes}
          lessonDate={selectedLesson.lesson_date}
          lessonTime={selectedLesson.start_time}
          instructorId={instructorId}
          onCancelled={fetchData}
        />
      )}

      {/* Reschedule Sheet */}
      {selectedLesson && (
        <RescheduleLessonSheet
          open={rescheduleDialogOpen}
          onOpenChange={(open) => { setRescheduleDialogOpen(open); if (!open) setSelectedLesson(null); }}
          lessonId={selectedLesson.id}
          instructorId={instructorId}
          pupilName={selectedLesson.pupil?.name || "Unknown"}
          currentDate={selectedLesson.lesson_date}
          currentTime={selectedLesson.start_time}
          durationMinutes={selectedLesson.duration_minutes}
          onRescheduled={fetchData}
        />
      )}

      {/* Add Lesson Sheet */}
      <AddLessonSheet
        open={addLessonOpen}
        onOpenChange={setAddLessonOpen}
        instructorId={instructorId}
        defaultDate={selectedDate}
        onSuccess={fetchData}
      />
    </div>
  );
}
