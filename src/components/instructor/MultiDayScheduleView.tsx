import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  format,
  addDays,
  isToday,
  isTomorrow,
  isYesterday,
  isSameYear,
  parseISO,
  startOfDay,
  endOfDay,
  differenceInMinutes,
} from "date-fns";
import { Loader2, MapPin, Video, ExternalLink, ChevronRight } from "lucide-react";
import { titleCaseName } from "@/lib/titleCase";
import { supabase } from "@/integrations/supabase/client";
import { ExpandableLessonCard } from "./ExpandableLessonCard";
import { LessonTextSheet } from "./LessonTextSheet";
import { GapFillCard } from "./GapFillCard";
import { RescheduleLessonSheet } from "./RescheduleLessonSheet";
import { CancelLessonDialog } from "./CancelLessonDialog";
import { AddLessonSheet } from "./AddLessonSheet";
import { triggerAutomations } from "@/utils/triggerAutomations";
import { toast } from "@/hooks/use-toast";
import {
  CATEGORY_STYLES,
  categoriseEvent,
  cleanEventTitle,
  formatDuration,
  styleFromGoogleColor,
  type EventCategory,
} from "./scheduleGoogleStyle";

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

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Roboto", "Helvetica Neue", sans-serif';

const formatTime = (timeStr: string) => {
  const [h, m] = timeStr.split(":");
  return `${h}:${m}`;
};

const getEndTime = (startTime: string, durationMinutes: number) => {
  const [h, m] = startTime.split(":").map(Number);
  const endMin = h * 60 + m + durationMinutes;
  return `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
};

/** Inline Google-style "+" icon for the FAB. */
function GooglePlusIcon() {
  const SW = 2.2;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* top arm — red */}
      <line x1="12" y1="4" x2="12" y2="11" stroke="#EA4335" strokeWidth={SW} strokeLinecap="round" />
      {/* right arm — yellow */}
      <line x1="13" y1="12" x2="20" y2="12" stroke="#FBBC04" strokeWidth={SW} strokeLinecap="round" />
      {/* left arm — green */}
      <line x1="4" y1="12" x2="11" y2="12" stroke="#34A853" strokeWidth={SW} strokeLinecap="round" />
      {/* bottom arm — blue */}
      <line x1="12" y1="13" x2="12" y2="20" stroke="#4285F4" strokeWidth={SW} strokeLinecap="round" />
    </svg>
  );
}

/** Tinted Google-Calendar-style chip. Used inside ExpandableLessonCard for lessons,
 *  and standalone for external events / manual blocks. */
function EventChip({
  category,
  title,
  timeLine,
  meta,
  isTask,
  taskCompleted,
  onTaskToggle,
  colorOverride,
}: {
  category: EventCategory;
  title: string;
  timeLine?: string | null;
  meta?: string | null;
  isTask?: boolean;
  taskCompleted?: boolean;
  onTaskToggle?: (e: React.MouseEvent) => void;
  colorOverride?: { bg: string; text: string; border: string } | null;
}) {
  const style = colorOverride ?? CATEGORY_STYLES[category];
  const padLeft = isTask ? 30 : 12;
  return (
    <div
      style={{
        position: "relative",
        backgroundColor: style.bg,
        border: "0.5px solid #E5E5EA",
        borderRadius: 10,
        padding: `10px 12px 10px ${padLeft}px`,
        overflow: "hidden",
        fontFamily: FONT_STACK,
      }}
    >
      {isTask && (
        <button
          type="button"
          aria-label={taskCompleted ? "Mark task incomplete" : "Mark task complete"}
          onClick={onTaskToggle}
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            width: 14,
            height: 14,
            border: "1.5px solid #6E6E73",
            borderRadius: 3,
            background: taskCompleted ? "#6E6E73" : "transparent",
            padding: 0,
            cursor: "pointer",
          }}
        />
      )}
      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: "-0.1px",
          lineHeight: 1.3,
          color: "#000000",
          marginBottom: 3,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {title}
      </div>
      {timeLine && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 400,
            color: "#6E6E73",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {timeLine}
        </div>
      )}
      {meta && (
        <div
          style={{
            fontSize: 11,
            color: "#6E6E73",
            marginTop: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {meta}
        </div>
      )}
      <span className="sr-only">{` ${category}`}</span>
    </div>
  );
}

/** Smart relative day-header label, e.g. "Mon 28 Apr · today". */
function formatDayHeader(d: Date): string {
  const base = format(d, "EEE d MMM");
  const yearSuffix = isSameYear(d, new Date()) ? "" : ` ${format(d, "yyyy")}`;
  let suffix = "";
  if (isToday(d)) suffix = " · today";
  else if (isTomorrow(d)) suffix = " · tomorrow";
  else if (isYesterday(d)) suffix = " · yesterday";
  return `${base}${yearSuffix}${suffix}`;
}

/** Hairline divider between rows within the same day. */
function RowDivider() {
  return (
    <div
      style={{
        height: 0.5,
        backgroundColor: "#E5E5EA",
        margin: "0 8px",
      }}
    />
  );
}

type RowStatus = "live" | "conflict" | "tentative" | null;

function StatusPill({ status }: { status: RowStatus }) {
  if (!status) return null;
  const map: Record<Exclude<RowStatus, null>, { bg: string; fg: string; label: string }> = {
    live: { bg: "#FBEAEC", fg: "#C8434F", label: "LIVE" },
    conflict: { bg: "#FBF1DE", fg: "#B8801F", label: "CONFLICT" },
    tentative: { bg: "#F2F2F4", fg: "#6E6E73", label: "TENTATIVE" },
  };
  const s = map[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: s.bg,
        color: s.fg,
        borderRadius: 999,
        padding: "2px 7px",
        fontSize: 9,
        fontWeight: 500,
        letterSpacing: "0.3px",
        flexShrink: 0,
      }}
    >
      {s.label}
    </span>
  );
}

/** Compact tappable lesson/event row used in the new Schedule list view. */
function ScheduleListRow({
  timeText,
  durationText,
  accentColor,
  title,
  subtitle,
  statusPill,
  showChevron,
  struck,
  onClick,
}: {
  timeText: string;
  durationText: string | null;
  accentColor: string;
  title: string;
  subtitle?: string | null;
  statusPill: RowStatus;
  showChevron: boolean;
  struck: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "stretch",
        gap: 14,
        width: "100%",
        textAlign: "left",
        background: "transparent",
        border: "none",
        padding: "14px 6px",
        cursor: "pointer",
        fontFamily: FONT_STACK,
      }}
    >
      {/* Time column */}
      <div
        style={{
          flexShrink: 0,
          minWidth: 56,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "center",
          paddingTop: 2,
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#000000",
            letterSpacing: "-0.3px",
            fontVariantNumeric: "tabular-nums",
            textDecoration: struck ? "line-through" : "none",
            lineHeight: 1.1,
          }}
        >
          {timeText}
        </span>
        {durationText && (
          <span
            style={{
              fontSize: 11.5,
              color: "#8E8E93",
              marginTop: 4,
              fontVariantNumeric: "tabular-nums",
              fontWeight: 500,
            }}
          >
            {durationText}
          </span>
        )}
      </div>

      {/* Card with left accent border */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "#FFFFFF",
          borderRadius: 16,
          padding: "14px 14px 14px 12px",
          minHeight: 72,
          boxShadow:
            "0 1px 2px rgba(16,24,40,0.04), 0 6px 18px -10px rgba(16,24,40,0.08)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Coloured left border */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 10,
            bottom: 10,
            width: 4,
            borderRadius: 4,
            backgroundColor: accentColor,
          }}
        />

        {/* Title + subtitle */}
        <div style={{ flex: 1, minWidth: 0, paddingLeft: 6 }}>
          <div
            style={{
              fontSize: 15.5,
              fontWeight: 600,
              color: "#000000",
              letterSpacing: "-0.2px",
              margin: "0 0 3px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              textDecoration: struck ? "line-through" : "none",
              lineHeight: 1.2,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: 12.5,
                color: "#6E6E73",
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                textDecoration: struck ? "line-through" : "none",
                lineHeight: 1.3,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        <StatusPill status={statusPill} />

        {showChevron && (
          <ChevronRight
            style={{ width: 14, height: 14, color: "#C7C7CC", flexShrink: 0, strokeWidth: 1.8 }}
          />
        )}
      </div>
    </button>
  );
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
  const [lessonForText, setLessonForText] = useState<ScheduledLesson | null>(null);
  const [bufferMinutes, setBufferMinutes] = useState<number>(0);

  // Default travel allowance applied symmetrically when surfacing fill-gap slots
  // (overridden by real ETA in the per-pupil text flow).
  const TRAVEL_FALLBACK_MIN = 10;
  const MIN_OFFERABLE_GAP_MIN = 60;

  // Live-updated "now" for the today indicator (refresh once a minute).
  const [nowTick, setNowTick] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNowTick(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const startDate = useMemo(() => startOfDay(new Date()), []);
  const days = useMemo(
    () => Array.from({ length: DAYS_TO_LOAD }, (_, i) => addDays(startDate, i)),
    [startDate],
  );

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
            test_centre_id, examiner_id,
            test_centre:test_centres(id, name, address, postcode),
            examiner:examiners(id, name, dvsa_staff_number),
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

  // Live updates: refresh schedule + gap candidates whenever bookings,
  // external calendar events, or manual blocks change for this instructor.
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!instructorId) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const trigger = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchData();
        queryClient.invalidateQueries({ queryKey: ["gap-candidate-pupils"] });
      }, 250);
    };

    const channel = supabase
      .channel(`schedule-live-${instructorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scheduled_lessons",
          filter: `instructor_id=eq.${instructorId}`,
        },
        trigger,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "instructor_calendar_events",
          filter: `instructor_id=eq.${instructorId}`,
        },
        trigger,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "instructor_manual_blocks",
          filter: `instructor_id=eq.${instructorId}`,
        },
        trigger,
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [instructorId, fetchData, queryClient]);

  useEffect(() => {
    if (!instructorId) return;
    supabase
      .from("instructors")
      .select("name, buffer_minutes")
      .eq("id", instructorId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.name) setInstructorName(data.name);
        if (data && typeof (data as { buffer_minutes?: number }).buffer_minutes === "number") {
          setBufferMinutes((data as { buffer_minutes: number }).buffer_minutes ?? 0);
        }
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
  const handleText = (lesson: ScheduledLesson) => { setLessonForText(lesson); };
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

  // Days that have at least one event — Google's Schedule view skips empty days.
  const visibleDays = useMemo(
    () => dayData.filter((d) => d.timeline.length > 0 || d.allDay.length > 0),
    [dayData],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16" style={{ backgroundColor: "transparent" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#2B7BC8" }} />
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#F2F2F4",
        color: "#1F1F1F",
        fontFamily: FONT_STACK,
        paddingBottom: 96,
        minHeight: "100%",
      }}
    >
      {/* Single white card containing day-grouped sections */}
      <div
        style={{
          margin: "12px 16px 0",
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          overflow: "hidden",
          border: "0.5px solid #E5E5EA",
        }}
      >
        {dayData.map(({ day, dateStr, timeline, allDay }, idx) => {
          const today = isToday(day);

          // Now indicator inputs (today only)
          const nowTimeStr = today
            ? `${String(nowTick.getHours()).padStart(2, "0")}:${String(nowTick.getMinutes()).padStart(2, "0")}`
            : null;
          const futureCount = nowTimeStr
            ? timeline.filter((t) => {
                const endStr =
                  t.kind === "lesson"
                    ? getEndTime(t.data.start_time, t.data.duration_minutes)
                    : t.kind === "external"
                      ? format(parseISO(t.data.end_time), "HH:mm")
                      : format(parseISO(t.data.end_datetime), "HH:mm");
                return endStr > nowTimeStr;
              }).length
            : 0;
          const showNowIndicator = today && nowTimeStr && futureCount > 0;

          const hasContent = timeline.length > 0 || allDay.length > 0;

          return (
            <div key={dateStr}>
              {/* Inter-day separator (skip before the very first day) */}
              {idx > 0 && (
                <div
                  style={{
                    height: 4,
                    backgroundColor: "#F2F2F4",
                  }}
                />
              )}

              {/* Day header (sticky) */}
              <div
                id={`schedule-day-${dateStr}`}
                ref={today ? todayRef : undefined}
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 5,
                  backgroundColor: "#FFFFFF",
                  padding: "10px 16px 6px",
                  borderBottom: "0.5px solid transparent",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 11,
                    fontWeight: 500,
                    color: today ? "#2B7BC8" : "#6E6E73",
                    letterSpacing: "0.3px",
                    textTransform: "uppercase",
                  }}
                >
                  {formatDayHeader(day)}
                </h3>
              </div>

              {/* Day rows container */}
              <div style={{ padding: "0 8px" }}>
                {/* All-day externals first */}
                {allDay.map((evt, aIdx) => {
                  const isExpanded = expandedEventId === evt.id;
                  const colorOverride = styleFromGoogleColor(evt.color);
                  const accent = colorOverride?.border || "#2B7BC8";
                  const showHairline = aIdx < allDay.length - 1 || timeline.length > 0;
                  return (
                    <div key={evt.id}>
                      <ScheduleListRow
                        timeText="All day"
                        durationText={null}
                        accentColor={accent}
                        title={cleanEventTitle(evt.title)}
                        subtitle={evt.location || "Google Calendar"}
                        statusPill={null}
                        showChevron={false}
                        struck={false}
                        onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                      />
                      {isExpanded && <ExternalDetails evt={evt} />}
                      {showHairline && <RowDivider />}
                    </div>
                  );
                })}

                {(() => {
                  const elements: React.ReactNode[] = [];
                  let nowRendered = false;

                  const pushNowIndicator = () => {
                    elements.push(
                      <div
                        key="now-indicator"
                        style={{
                          display: "flex",
                          gap: 8,
                          padding: "6px 8px",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: "#C8434F",
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: "#C8434F",
                            letterSpacing: "0.2px",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {nowTimeStr}
                        </span>
                        <div
                          style={{
                            flex: 1,
                            height: 1,
                            backgroundColor: "#C8434F",
                            opacity: 0.3,
                          }}
                        />
                      </div>,
                    );
                    nowRendered = true;
                  };

                  // Helper: should a hairline divider follow this lesson row?
                  const lastTimelineIdx = timeline.length - 1;

                  timeline.forEach((item, i) => {
                    if (showNowIndicator && nowTimeStr && !nowRendered && item.time > nowTimeStr) {
                      pushNowIndicator();
                    }

                    if (item.kind === "lesson") {
                      const lesson = item.data;
                      const endTime = getEndTime(lesson.start_time, lesson.duration_minutes);
                      const durationStr = formatDuration(lesson.duration_minutes);
                      const location =
                        lesson.pickup_location ||
                        lesson.pupil?.address ||
                        lesson.pickup_postcode ||
                        null;

                      // Live = now is between start and end on today only
                      const isLive =
                        today &&
                        nowTimeStr &&
                        lesson.start_time <= nowTimeStr &&
                        endTime > nowTimeStr;

                      const isDrivingTest = (lesson.lesson_type || "")
                        .toLowerCase()
                        .includes("driving test");

                      const accent = isDrivingTest
                        ? "#C8434F"
                        : "#2B7BC8"; // DSM-native default

                      const pupilName = titleCaseName(lesson.pupil?.name || "Lesson");
                      const title = isDrivingTest
                        ? `${pupilName} · driving test`
                        : pupilName;

                      const subtitleParts = [
                        isDrivingTest ? "Driving test" : `${lesson.lesson_type || "Standard"} lesson`,
                        location || undefined,
                      ].filter(Boolean) as string[];

                      const status = isLive
                        ? "live"
                        : (lesson as any).status === "tentative"
                          ? "tentative"
                          : null;

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
                            <ScheduleListRow
                              timeText={formatTime(lesson.start_time)}
                              durationText={durationStr}
                              accentColor={accent}
                              title={title}
                              subtitle={subtitleParts.join(" · ")}
                              statusPill={status as any}
                              showChevron={true}
                              struck={false}
                            />
                          }
                        />,
                      );
                      if (i < lastTimelineIdx) elements.push(<RowDivider key={`d-${lesson.id}`} />);
                    }

                    if (item.kind === "external") {
                      const evt = item.data;
                      const startDt = parseISO(evt.start_time);
                      const endDt = parseISO(evt.end_time);
                      const colorOverride = styleFromGoogleColor(evt.color);
                      const accent = colorOverride?.border || "#8A5BC9";
                      const isExpanded = expandedEventId === evt.id;
                      const durationMins = differenceInMinutes(endDt, startDt);
                      const durationStr = formatDuration(durationMins);

                      elements.push(
                        <div key={evt.id}>
                          <ScheduleListRow
                            timeText={format(startDt, "HH:mm")}
                            durationText={durationStr}
                            accentColor={accent}
                            title={cleanEventTitle(evt.title)}
                            subtitle={evt.location || "Google Calendar"}
                            statusPill={null}
                            showChevron={false}
                            struck={false}
                            onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                          />
                          {isExpanded && <ExternalDetails evt={evt} />}
                        </div>,
                      );
                      if (i < lastTimelineIdx) elements.push(<RowDivider key={`d-${evt.id}`} />);
                    }

                    if (item.kind === "block") {
                      const block = item.data;
                      const startDt = parseISO(block.start_datetime);
                      const endDt = parseISO(block.end_datetime);
                      const category = categoriseEvent(block.title, "block", { blockType: block.block_type });
                      const isExpanded = expandedEventId === `block-${block.id}`;
                      const durationMins = differenceInMinutes(endDt, startDt);
                      const durationStr = formatDuration(durationMins);
                      const accent = CATEGORY_STYLES[category]?.border || "#6E6E73";

                      elements.push(
                        <div key={block.id}>
                          <ScheduleListRow
                            timeText={format(startDt, "HH:mm")}
                            durationText={durationStr}
                            accentColor={accent}
                            title={cleanEventTitle(block.title)}
                            subtitle={category === "task" ? "Task" : "Personal · blocked"}
                            statusPill={null}
                            showChevron={true}
                            struck={false}
                            onClick={() => setExpandedEventId(isExpanded ? null : `block-${block.id}`)}
                          />
                          {isExpanded && (
                            <div style={{ padding: "6px 16px 10px", fontSize: 12, color: "#5F6368" }}>
                              {block.notes || (
                                <span style={{ fontStyle: "italic", color: "#9AA0A6" }}>No notes</span>
                              )}
                            </div>
                          )}
                        </div>,
                      );
                      if (i < lastTimelineIdx) elements.push(<RowDivider key={`d-${block.id}`} />);
                    }

                    // Gap Filler — preserved exactly as today, inline at the
                    // same chronological position, with its existing component.
                    if (i < timeline.length - 1) {
                      const nextItem = timeline[i + 1];
                      const currentEndStr =
                        item.kind === "lesson"
                          ? getEndTime(item.data.start_time, item.data.duration_minutes)
                          : item.kind === "external"
                            ? format(parseISO(item.data.end_time), "HH:mm")
                            : format(parseISO(item.data.end_datetime), "HH:mm");
                      const nextStartStr = nextItem.time;
                      const [cH, cM] = currentEndStr.split(":").map(Number);
                      const [nH, nM] = nextStartStr.split(":").map(Number);
                      const rawGapMin = (nH * 60 + nM) - (cH * 60 + cM);

                      const sideAllowance = bufferMinutes + TRAVEL_FALLBACK_MIN;
                      const effectiveStartMin = cH * 60 + cM + sideAllowance;
                      const effectiveEndMin = nH * 60 + nM - sideAllowance;
                      const effectiveGapMin = effectiveEndMin - effectiveStartMin;

                      if (effectiveGapMin >= MIN_OFFERABLE_GAP_MIN) {
                        const fmt = (mins: number) =>
                          `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
                        elements.push(
                          <div key={`gap-${i}`} style={{ padding: "8px 8px" }}>
                            <GapFillCard
                              instructorId={instructorId}
                              instructorName={instructorName}
                              date={dateStr}
                              startTime={fmt(effectiveStartMin)}
                              endTime={fmt(effectiveEndMin)}
                              gapMinutes={effectiveGapMin}
                            />
                          </div>,
                        );
                      }
                      void rawGapMin;
                    }
                  });

                  if (showNowIndicator && nowTimeStr && !nowRendered) {
                    pushNowIndicator();
                  }

                  // Empty-day placeholder
                  if (!hasContent) {
                    elements.push(
                      <div
                        key="empty"
                        style={{ padding: "0 16px 14px" }}
                      >
                        <p
                          style={{
                            margin: "8px 0",
                            fontSize: 12,
                            color: "#6E6E73",
                            fontStyle: "italic",
                          }}
                        >
                          No lessons
                        </p>
                      </div>,
                    );
                  }

                  return elements;
                })()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom spacer for FAB */}
      <div style={{ height: 96 }} />

      {/* Google-style FAB */}
      <button
        type="button"
        onClick={() => setAddLessonOpen(true)}
        aria-label="Create event"
        style={{
          position: "fixed",
          right: 16,
          bottom: 96,
          width: 52,
          height: 52,
          borderRadius: 16,
          background: "#FFFFFF",
          border: "none",
          boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 50,
          padding: 0,
        }}
      >
        <GooglePlusIcon />
      </button>

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

      {/* Text Pupil Sheet */}
      <LessonTextSheet
        open={!!lessonForText}
        onOpenChange={(open) => { if (!open) setLessonForText(null); }}
        instructorId={instructorId}
        instructorName={instructorName}
        lesson={lessonForText ? {
          id: lessonForText.id,
          pupilId: lessonForText.pupil.id,
          pupilName: lessonForText.pupil.name,
          pupilPhone: lessonForText.pupil.phone,
          date: lessonForText.lesson_date,
          startTime: lessonForText.start_time.slice(0, 5),
          endTime: (() => {
            const [h, m] = lessonForText.start_time.split(":").map(Number);
            const total = h * 60 + m + lessonForText.duration_minutes;
            const eh = Math.floor(total / 60) % 24;
            const em = total % 60;
            return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
          })(),
        } : null}
      />
    </div>
  );
}

/** Expanded details panel for a Google Calendar event (preserves prior info). */
function ExternalDetails({ evt }: { evt: ExternalEvent }) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        padding: "8px 12px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        fontFamily: FONT_STACK,
      }}
    >
      {evt.meeting_url && (
        <a
          href={evt.meeting_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            backgroundColor: "#1A73E8",
            color: "#FFFFFF",
            fontSize: 13,
            fontWeight: 500,
            padding: "8px 12px",
            borderRadius: 6,
            textDecoration: "none",
          }}
        >
          <Video style={{ width: 14, height: 14 }} />
          Join {evt.meeting_provider || "Meeting"}
        </a>
      )}
      {evt.location && (
        <div style={{ display: "flex", gap: 6, fontSize: 12, color: "#5F6368" }}>
          <MapPin style={{ width: 12, height: 12, marginTop: 2, flexShrink: 0 }} />
          <span>{evt.location}</span>
        </div>
      )}
      {evt.description && (
        <div style={{ fontSize: 12, color: "#5F6368", whiteSpace: "pre-wrap", lineHeight: 1.4 }}>
          {evt.description}
        </div>
      )}
      {evt.html_link && (
        <a
          href={evt.html_link}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#1A73E8", textDecoration: "none" }}
        >
          <ExternalLink style={{ width: 11, height: 11 }} />
          Open in Google Calendar
        </a>
      )}
    </div>
  );
}
