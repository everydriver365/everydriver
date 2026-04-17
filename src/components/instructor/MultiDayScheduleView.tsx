import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format, addDays, isToday, parseISO, startOfDay, endOfDay, isSameDay, differenceInMinutes } from "date-fns";
import { Calendar, Clock, MapPin, Plus, Loader2, CheckCircle2, ChevronDown, Video, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ExpandableLessonCard } from "./ExpandableLessonCard";
import { GapFillCard } from "./GapFillCard";
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
  location: string | null;
  description: string | null;
  is_busy: boolean;
  meeting_url: string | null;
  meeting_provider: string | null;
  html_link: string | null;
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

const DAYS_TO_LOAD = 365;

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

// Google Calendar color mapping — uses the exact hex values stored from the feed
// Google Calendar colorId → hex: 1=#7986CB, 2=#33B679, 3=#8E24AA, 4=#E67C73,
// 5=#F6BF26, 6=#F4511E, 7=#039BE5, 8=#616161, 9=#3F51B5, 10=#0B8043, 11=#D50000
const GOOGLE_COLOR_MAP: Record<string, { bg: string; text: string; textMuted: string }> = {
  "#7986cb": { bg: "#B3AFF5", text: "#2E2875", textMuted: "rgba(46,40,117,0.75)" },   // 1 Lavender
  "#33b679": { bg: "#8FCFA5", text: "#1A4D2E", textMuted: "rgba(26,77,46,0.75)" },    // 2 Sage
  "#8e24aa": { bg: "#C9A0DC", text: "#4A1162", textMuted: "rgba(74,17,98,0.75)" },     // 3 Grape
  "#e67c73": { bg: "#E89999", text: "#5C1717", textMuted: "rgba(92,23,23,0.75)" },     // 4 Flamingo
  "#f6bf26": { bg: "#F4D06F", text: "#5C4A0F", textMuted: "rgba(92,74,15,0.75)" },     // 5 Banana
  "#f4511e": { bg: "#F0A68A", text: "#6B200A", textMuted: "rgba(107,32,10,0.75)" },    // 6 Tangerine
  "#039be5": { bg: "#7FB3E3", text: "#0A3559", textMuted: "rgba(10,53,89,0.75)" },     // 7 Peacock
  "#616161": { bg: "#B8B8B8", text: "#2A2A2A", textMuted: "rgba(42,42,42,0.75)" },     // 8 Graphite
  "#3f51b5": { bg: "#8E9AE6", text: "#1A2266", textMuted: "rgba(26,34,102,0.75)" },    // 9 Blueberry
  "#0b8043": { bg: "#7CC9A0", text: "#0A3D20", textMuted: "rgba(10,61,32,0.75)" },     // 10 Basil
  "#d50000": { bg: "#E88A8A", text: "#5C0000", textMuted: "rgba(92,0,0,0.75)" },       // 11 Tomato
};

function getCardColors(color: string | null, lessonType?: string): { bg: string; text: string; textMuted: string } {
  // Lesson types get specific colors
  if (lessonType) {
    const lessonColors: Record<string, { bg: string; text: string; textMuted: string }> = {
      standard: { bg: "#7FB3E3", text: "#0A3559", textMuted: "rgba(10,53,89,0.75)" },
      test_prep: { bg: "#F4D06F", text: "#5C4A0F", textMuted: "rgba(92,74,15,0.75)" },
      mock_test: { bg: "#E89999", text: "#5C1717", textMuted: "rgba(92,23,23,0.75)" },
      motorway: { bg: "#8FCFA5", text: "#1A4D2E", textMuted: "rgba(26,77,46,0.75)" },
      refresher: { bg: "#7FB3E3", text: "#0A3559", textMuted: "rgba(10,53,89,0.75)" },
      intensive: { bg: "#B3AFF5", text: "#2E2875", textMuted: "rgba(46,40,117,0.75)" },
      first_lesson: { bg: "#8FCFA5", text: "#1A4D2E", textMuted: "rgba(26,77,46,0.75)" },
      pass_plus: { bg: "#B3AFF5", text: "#2E2875", textMuted: "rgba(46,40,117,0.75)" },
      driving_test: { bg: "#F4D06F", text: "#5C4A0F", textMuted: "rgba(92,74,15,0.75)" },
    };
    return lessonColors[lessonType] || { bg: "#7FB3E3", text: "#0A3559", textMuted: "rgba(10,53,89,0.75)" };
  }

  // External events: match the exact hex from the Google Calendar feed
  if (!color) return { bg: "#D4D4D8", text: "#3F3F46", textMuted: "rgba(63,63,70,0.75)" };
  
  const mapped = GOOGLE_COLOR_MAP[color.toLowerCase()];
  if (mapped) return mapped;

  return { bg: "#D4D4D8", text: "#3F3F46", textMuted: "rgba(63,63,70,0.75)" };
}

// Block type colors
function getBlockColors(blockType: string): { bg: string; text: string; textMuted: string } {
  switch (blockType) {
    case "break": return { bg: "#F4D06F", text: "#5C4A0F", textMuted: "rgba(92,74,15,0.75)" };
    case "meeting": return { bg: "#B3AFF5", text: "#2E2875", textMuted: "rgba(46,40,117,0.75)" };
    default: return { bg: "#D4D4D8", text: "#3F3F46", textMuted: "rgba(63,63,70,0.75)" };
  }
}

export function MultiDayScheduleView({ instructorId }: MultiDayScheduleViewProps) {
  const navigate = useNavigate();
  const todayRef = useRef<HTMLDivElement>(null);
  const [lessons, setLessons] = useState<ScheduledLesson[]>([]);
  const [externalEvents, setExternalEvents] = useState<ExternalEvent[]>([]);
  const [manualBlocks, setManualBlocks] = useState<ManualBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [addLessonOpen, setAddLessonOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<ScheduledLesson | null>(null);
  const [sendingMessage, setSendingMessage] = useState<string | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [instructorName, setInstructorName] = useState<string>("Your instructor");

  const startDate = useMemo(() => startOfDay(new Date()), []);
  const days = useMemo(() => Array.from({ length: DAYS_TO_LOAD }, (_, i) => addDays(startDate, i)), [startDate]);

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
          .select("id, title, start_time, end_time, color, location, description, is_busy, meeting_url, meeting_provider, html_link")
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
        return {
          id: evt.id,
          title: evt.title || "Busy",
          start_time: evt.start_time,
          end_time: evt.end_time,
          color: evt.color,
          is_all_day: isAllDay,
          location: evt.location || null,
          description: evt.description || null,
          is_busy: evt.is_busy ?? true,
          meeting_url: evt.meeting_url || null,
          meeting_provider: evt.meeting_provider || null,
          html_link: evt.html_link || null,
        };
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

  useEffect(() => {
    if (!instructorId) return;
    supabase
      .from("instructors")
      .select("name")
      .eq("id", instructorId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.name) setInstructorName(data.name);
      });
  }, [instructorId]);

  useEffect(() => {
    if (!loading && todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading]);

  // --- Handlers ---
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
      const dayExternal = externalEvents.filter((e) => e.start_time.slice(0, 10) === dateStr);
      const dayBlocks = manualBlocks.filter((b) => b.start_datetime.slice(0, 10) === dateStr);

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

  // Now indicator time
  const nowMinutes = useMemo(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#2A394F" }} />
      </div>
    );
  }

  return (
    <div className="space-y-0 pb-32">
      {/* Add lesson FAB */}
      <div
        onClick={() => setAddLessonOpen(true)}
        style={{
          position: "fixed",
          bottom: 80,
          left: 20,
          right: 20,
          maxWidth: 420,
          margin: "0 auto",
          background: "#2A394F",
          color: "#FFFFFF",
          borderRadius: 12,
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 500,
          zIndex: 40,
          boxShadow: "0 4px 12px rgba(107, 99, 214, 0.25)",
        }}
      >
        <Plus style={{ width: 18, height: 18 }} />
        Add Lesson
      </div>

      {/* Multi-day list */}
      <div className="space-y-0">
        {dayData.map(({ day, dateStr, timeline, allDay }, idx) => {
          const prevDay = idx > 0 ? dayData[idx - 1].day : null;
          const showMonthHeader = !prevDay || day.getMonth() !== prevDay.getMonth();
          const today = isToday(day);
          const isEmpty = timeline.length === 0 && allDay.length === 0;

          // Compute "now" indicator position for today
          const shouldShowNow = today;

          return (
            <div key={dateStr}>
              {showMonthHeader && (
                <div style={{ padding: "16px 0 12px" }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#18181B" }}>
                    {format(day, "MMMM yyyy")}
                  </span>
                </div>
              )}
              <div
                id={`schedule-day-${dateStr}`}
                ref={today ? todayRef : undefined}
                className="flex"
                style={{ minHeight: 60, gap: 0, marginBottom: 24 }}
              >
                {/* Left date column */}
                <div style={{ width: 56, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 4 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    color: today ? "#2A394F" : "#71717A",
                    letterSpacing: "0.02em",
                  }}>
                    {format(day, "EEE")}
                  </span>
                  <div style={{
                    marginTop: 4,
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    ...(today ? { backgroundColor: "#C7C5FF" } : {}),
                  }}>
                    <span style={{
                      fontSize: 28,
                      fontWeight: 300,
                      color: today ? "#1A1840" : "#18181B",
                      lineHeight: 1,
                    }}>
                      {format(day, "d")}
                    </span>
                  </div>
                </div>

                {/* Right events column */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8, position: "relative" }}>
                  {/* All-day events */}
                  {allDay.map((evt) => {
                    const colors = getCardColors(evt.color);
                    const isExpanded = expandedEventId === evt.id;
                    return (
                      <div
                        key={evt.id}
                        onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                        style={{
                          position: "relative",
                          backgroundColor: "#FFFFFF",
                          borderRadius: 14,
                          border: "0.5px solid #E4E4E7",
                          padding: "12px 16px 12px 20px",
                          minHeight: 48,
                          cursor: "pointer",
                          overflow: "hidden",
                        }}
                      >
                        {/* Left color accent */}
                        <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 4, backgroundColor: colors.bg, borderRadius: "14px 0 0 14px" }} />
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: colors.bg, flexShrink: 0 }} />
                          <span style={{ fontSize: 15, fontWeight: 500, color: "#18181B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, fontFamily: "Inter, sans-serif" }}>
                            {evt.title}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 500, color: "#71717A", flexShrink: 0 }}>All day</span>
                        </div>
                        {isExpanded && (
                          <div style={{ marginTop: 10, borderTop: "1px solid #E4E4E7", paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                            {evt.location && (
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                                <MapPin style={{ width: 14, height: 14, color: "#71717A", marginTop: 2, flexShrink: 0 }} />
                                <span style={{ fontSize: 13, color: "#18181B" }}>{evt.location}</span>
                              </div>
                            )}
                            {evt.description && (
                              <div style={{ fontSize: 13, color: "#71717A", whiteSpace: "pre-wrap", lineHeight: 1.4 }}>
                                {evt.description}
                              </div>
                            )}
                            <span style={{ fontSize: 11, color: "#A1A1AA", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                              {evt.is_busy ? "Busy" : "Free"} · Google Calendar
                            </span>
                            {!evt.location && !evt.description && (
                              <span style={{ fontSize: 12, color: "#A1A1AA", fontStyle: "italic" }}>No additional details</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Now indicator */}
                  {shouldShowNow && timeline.length > 0 && (() => {
                    // Find position: between which items does "now" fall?
                    const nowTimeStr = `${String(Math.floor(nowMinutes / 60)).padStart(2, "0")}:${String(nowMinutes % 60).padStart(2, "0")}`;
                    let insertIdx = timeline.length;
                    for (let i = 0; i < timeline.length; i++) {
                      if (timeline[i].time > nowTimeStr) { insertIdx = i; break; }
                    }
                    // We'll render it inline via the timeline below
                    return null;
                  })()}

                  {/* Timeline items with now-indicator interleaved */}
                  {(() => {
                    const nowTimeStr = shouldShowNow
                      ? `${String(Math.floor(nowMinutes / 60)).padStart(2, "0")}:${String(nowMinutes % 60).padStart(2, "0")}`
                      : null;
                    let nowRendered = false;

                    const elements: React.ReactNode[] = [];

                    timeline.forEach((item, i) => {
                      // Insert now indicator before this item if needed
                      if (shouldShowNow && nowTimeStr && !nowRendered && item.time > nowTimeStr) {
                        elements.push(
                          <div key="now-indicator" style={{ display: "flex", alignItems: "center", gap: 0, margin: "4px 0" }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#18181B", flexShrink: 0, marginLeft: -32 }} />
                            <div style={{ flex: 1, height: 1, backgroundColor: "rgba(24,24,27,0.6)" }} />
                          </div>
                        );
                        nowRendered = true;
                      }

                      if (item.kind === "lesson") {
                        const lesson = item.data;
                        const colors = getCardColors(null, lesson.lesson_type);
                        const endTime = getEndTime(lesson.start_time, lesson.duration_minutes);
                        const location = lesson.pickup_location || lesson.pupil?.address;

                        elements.push(
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
                                style={{
                                  position: "relative",
                                  padding: "12px 32px 12px 20px",
                                  minHeight: 48,
                                  overflow: "hidden",
                                }}
                              >
                                {/* Left color accent */}
                                <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 4, backgroundColor: colors.bg, borderRadius: "14px 0 0 14px" }} />
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: colors.bg, flexShrink: 0 }} />
                                  <span style={{ fontSize: 15, fontWeight: 500, color: "#18181B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, fontFamily: "Inter, sans-serif" }}>
                                    {lesson.pupil?.name || "Unknown"}
                                  </span>
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 400, color: "#71717A", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingLeft: 18, fontFamily: "Inter, sans-serif" }}>
                                  {formatTime(lesson.start_time)} – {endTime}
                                  {location ? ` at ${location}` : ""}
                                </div>
                              </div>
                            }
                          />
                        );
                      }

                      if (item.kind === "external") {
                        const evt = item.data;
                        const startDt = parseISO(evt.start_time);
                        const endDt = parseISO(evt.end_time);
                        const colors = getCardColors(evt.color);
                        const isExpanded = expandedEventId === evt.id;
                        const durationMins = differenceInMinutes(endDt, startDt);
                        const durationStr = durationMins >= 60 ? `${Math.floor(durationMins / 60)}h ${durationMins % 60 > 0 ? `${durationMins % 60}m` : ""}` : `${durationMins}m`;

                        elements.push(
                          <div
                            key={evt.id}
                            onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                            style={{
                              position: "relative",
                              backgroundColor: "#FFFFFF",
                              borderRadius: 14,
                              border: "0.5px solid #E4E4E7",
                              padding: "12px 32px 12px 20px",
                              minHeight: 48,
                              cursor: "pointer",
                              overflow: "hidden",
                              transition: "background 120ms ease",
                            }}
                          >
                            {/* Left color accent */}
                            <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 4, backgroundColor: colors.bg, borderRadius: "14px 0 0 14px" }} />
                            {/* Chevron */}
                            <ChevronDown
                              style={{
                                position: "absolute",
                                top: "50%",
                                right: 12,
                                transform: `translateY(-50%) ${isExpanded ? "rotate(180deg)" : "rotate(0deg)"}`,
                                width: 16,
                                height: 16,
                                color: "#71717A",
                                transition: "transform 200ms ease",
                                pointerEvents: "none",
                              }}
                            />
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: colors.bg, flexShrink: 0 }} />
                              <span style={{ fontSize: 15, fontWeight: 500, color: "#18181B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, fontFamily: "Inter, sans-serif" }}>
                                {evt.title}
                              </span>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 400, color: "#71717A", marginTop: 2, paddingLeft: 18, fontFamily: "Inter, sans-serif" }}>
                              {format(startDt, "HH:mm")} – {format(endDt, "HH:mm")} · {durationStr}
                            </div>
                            {isExpanded && (
                              <div style={{ marginTop: 10, borderTop: "1px solid #E4E4E7", paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                                {evt.location && (
                                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                                    <MapPin style={{ width: 14, height: 14, color: "#71717A", marginTop: 2, flexShrink: 0 }} />
                                    <span style={{ fontSize: 13, color: "#18181B" }}>{evt.location}</span>
                                  </div>
                                )}
                                {evt.description && (
                                  <div style={{ fontSize: 13, color: "#71717A", whiteSpace: "pre-wrap", lineHeight: 1.4 }}>
                                    {evt.description}
                                  </div>
                                )}
                                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 2 }}>
                                  <span style={{ fontSize: 11, color: "#A1A1AA", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                    {evt.is_busy ? "Busy" : "Free"} · Google Calendar
                                  </span>
                                </div>
                                {!evt.location && !evt.description && (
                                  <span style={{ fontSize: 12, color: "#A1A1AA", fontStyle: "italic" }}>No additional details</span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }

                      if (item.kind === "block") {
                        const block = item.data;
                        const startDt = parseISO(block.start_datetime);
                        const endDt = parseISO(block.end_datetime);
                        const colors = getBlockColors(block.block_type);
                        const isExpanded = expandedEventId === `block-${block.id}`;
                        const durationMins = differenceInMinutes(endDt, startDt);
                        const durationStr = durationMins >= 60 ? `${Math.floor(durationMins / 60)}h ${durationMins % 60 > 0 ? `${durationMins % 60}m` : ""}` : `${durationMins}m`;

                        elements.push(
                          <div
                            key={block.id}
                            onClick={() => setExpandedEventId(isExpanded ? null : `block-${block.id}`)}
                            style={{
                              position: "relative",
                              backgroundColor: "#FFFFFF",
                              borderRadius: 14,
                              border: "0.5px solid #E4E4E7",
                              padding: "12px 32px 12px 20px",
                              minHeight: 48,
                              cursor: "pointer",
                              overflow: "hidden",
                            }}
                          >
                            {/* Left color accent */}
                            <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 4, backgroundColor: colors.bg, borderRadius: "14px 0 0 14px" }} />
                            {/* Chevron */}
                            <ChevronDown
                              style={{
                                position: "absolute",
                                top: "50%",
                                right: 12,
                                transform: `translateY(-50%) ${isExpanded ? "rotate(180deg)" : "rotate(0deg)"}`,
                                width: 16,
                                height: 16,
                                color: "#71717A",
                                transition: "transform 200ms ease",
                                pointerEvents: "none",
                              }}
                            />
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: colors.bg, flexShrink: 0 }} />
                              <span style={{ fontSize: 15, fontWeight: 500, color: "#18181B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, fontFamily: "Inter, sans-serif" }}>
                                {block.title}
                              </span>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 400, color: "#71717A", marginTop: 2, paddingLeft: 18, fontFamily: "Inter, sans-serif" }}>
                              {format(startDt, "HH:mm")} – {format(endDt, "HH:mm")} · {durationStr}
                            </div>
                            {isExpanded && (
                              <div style={{ marginTop: 10, borderTop: "1px solid #E4E4E7", paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                                <span style={{ fontSize: 12, color: "#A1A1AA", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                  {block.block_type === "break" ? "Break" : block.block_type === "meeting" ? "Meeting" : "Personal"}
                                </span>
                                {block.notes && (
                                  <div style={{ fontSize: 13, color: "#18181B", whiteSpace: "pre-wrap", lineHeight: 1.4 }}>
                                    {block.notes}
                                  </div>
                                )}
                                {!block.notes && (
                                  <span style={{ fontSize: 12, color: "#A1A1AA", fontStyle: "italic" }}>No notes</span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Gap insight: check gap to next item
                      if (i < timeline.length - 1) {
                        const nextItem = timeline[i + 1];
                        const currentEndStr = item.kind === "lesson"
                          ? getEndTime(item.data.start_time, item.data.duration_minutes)
                          : item.kind === "external"
                            ? format(parseISO(item.data.end_time), "HH:mm")
                            : format(parseISO(item.data.end_datetime), "HH:mm");
                        const nextStartStr = nextItem.time;
                        const [cH, cM] = currentEndStr.split(":").map(Number);
                        const [nH, nM] = nextStartStr.split(":").map(Number);
                        const gapMin = (nH * 60 + nM) - (cH * 60 + cM);
                        if (gapMin >= 60) {
                          const isSignificant = gapMin >= 60;

                          if (isSignificant) {
                            elements.push(
                              <GapFillCard
                                key={`gap-${i}`}
                                instructorId={instructorId}
                                instructorName={instructorName}
                                date={dateStr}
                                startTime={currentEndStr}
                                endTime={nextStartStr}
                                gapMinutes={gapMin}
                              />
                            );
                          } else {
                            const hours = Math.floor(gapMin / 60);
                            const mins = gapMin % 60;
                            const label = mins > 0 ? `${hours}h ${mins}m gap` : `${hours}-hour gap`;
                            elements.push(
                              <div
                                key={`gap-${i}`}
                                onClick={() => setAddLessonOpen(true)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  cursor: "pointer",
                                  margin: "4px 0",
                                }}
                              >
                                <div style={{ flex: 1, borderTop: "1px dashed #D4D4D8" }} />
                                <span style={{ fontSize: 11, color: "#A1A1AA", whiteSpace: "nowrap" }}>{label}</span>
                                <div style={{ flex: 1, borderTop: "1px dashed #D4D4D8" }} />
                              </div>
                            );
                          }
                        }
                      }
                    });

                    // Now indicator at end if not yet rendered
                    if (shouldShowNow && nowTimeStr && !nowRendered) {
                      elements.push(
                        <div key="now-indicator" style={{ display: "flex", alignItems: "center", gap: 0, margin: "4px 0" }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#18181B", flexShrink: 0, marginLeft: -32 }} />
                          <div style={{ flex: 1, height: 1, backgroundColor: "rgba(24,24,27,0.6)" }} />
                        </div>
                      );
                    }

                    return elements;
                  })()}

                  {/* Empty state */}
                  {isEmpty && (
                    <div style={{ display: "flex", alignItems: "center", height: 48, fontSize: 13, color: "#A1A1AA" }}>
                      No events
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom spacer for FAB */}
      <div style={{ height: 120 }} />

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
        defaultDate={new Date()}
        onSuccess={fetchData}
      />
    </div>
  );
}
