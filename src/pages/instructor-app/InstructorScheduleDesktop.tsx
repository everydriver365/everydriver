import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ChevronLeft, ChevronRight, Plus, Search, Filter,
} from "lucide-react";
import {
  DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable,
  useSensor, useSensors, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { DashboardShell } from "@/components/instructor/dashboardV2/DashboardShell";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

// ---- Types & constants ----
type LessonType = "standard" | "motorway" | "mock" | "test";
type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

interface Lesson {
  id: string;
  pupil: string;
  pupilId: string;
  day: Day;
  startMin: number; // minutes from 00:00
  durationMin: number;
  type: LessonType;
}

interface PupilLite {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  lastLessonDays: number | null;
}

const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOUR_START = 8;
const HOUR_END = 17;
const HOUR_PX = 50;

const TYPE_COLOR: Record<LessonType, { line: string; bg: string; text: string; label: string }> = {
  standard: { line: "#378ADD", bg: "#E6F1FB", text: "#0B3A66", label: "Standard" },
  motorway: { line: "#1D9E75", bg: "#DEF3EA", text: "#0E4A36", label: "Motorway" },
  mock:     { line: "#BA7517", bg: "#FAEBD3", text: "#5B3A0B", label: "Mock test" },
  test:     { line: "#993556", bg: "#F7E1E8", text: "#4A1626", label: "Test" },
};

// Map JS getDay() (0=Sun..6=Sat) → Day code
const JS_DAY: Day[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// availability_windows.day_of_week uses 0=Sun..6=Sat (Postgres convention)
const dayFromDOW = (dow: number): Day => JS_DAY[dow];

function lessonTypeFromString(s: string | null | undefined): LessonType {
  const v = (s || "").toLowerCase();
  if (v.includes("motorway")) return "motorway";
  if (v.includes("mock")) return "mock";
  if (v.includes("test")) return "test";
  return "standard";
}

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = x.getDay(); // 0=Sun
  const diff = (dow + 6) % 7; // days since Monday
  x.setDate(x.getDate() - diff);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d); x.setDate(x.getDate() + n); return x;
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

const palette: Record<string, { bg: string; text: string }> = {
  coral:  { bg: "#F0997B", text: "#4A1B0C" },
  blue:   { bg: "#85B7EB", text: "#042C53" },
  green:  { bg: "#C0DD97", text: "#173404" },
  pink:   { bg: "#ED93B1", text: "#4B1528" },
  purple: { bg: "#AFA9EC", text: "#26215C" },
  gray:   { bg: "#B4B2A9", text: "#2C2C2A" },
  amber:  { bg: "#FAC775", text: "#412402" },
};

const PALETTE_KEYS = Object.keys(palette);
function colorForId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE_KEYS[h % PALETTE_KEYS.length];
}

function initialsOf(name: string): string {
  return (name || "")
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map(s => s[0]).join("").toUpperCase() || "?";
}



function fmtTime(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ---- Page ----
type View = "day" | "week" | "month" | "agenda";

export default function InstructorScheduleDesktop() {
  const navigate = useNavigate();
  const { instructor, signOut } = useInstructorAuth();
  const { total: notificationCount } = useCombinedNotificationCount(instructor?.id);

  const [view, setView] = useState<View>("week");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const todayDay: Day = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (today < weekStart || today > weekEnd) return "" as Day;
    return JS_DAY[today.getDay()];
  }, [weekStart, weekEnd]);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [pupils, setPupils] = useState<PupilLite[]>([]);
  const [availability, setAvailability] = useState<Record<Day, "off" | { start: string; end: string }>>({
    Mon: "off", Tue: "off", Wed: "off", Thu: "off", Fri: "off", Sat: "off", Sun: "off",
  });
  // Instructor settings
  const [bufferMinutes, setBufferMinutes] = useState<number>(15);
  const [allowedDurations, setAllowedDurations] = useState<number[]>([60, 120]);
  const [preferredDuration, setPreferredDuration] = useState<number>(60);
  const [minNoticeHours, setMinNoticeHours] = useState<number>(0);
  // Google Calendar busy events for current week (external)
  const [externalBusy, setExternalBusy] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const [activeDrag, setActiveDrag] = useState<
    | { kind: "pupil"; pupil: PupilLite }
    | { kind: "lesson"; lesson: Lesson }
    | null
  >(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [debouncedPrompt, setDebouncedPrompt] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<{ label: string }[] | null>(null);
  const [filterDays, setFilterDays] = useState<Day[]>([]);
  const [filterFrom, setFilterFrom] = useState<string>("");
  const [filterTo, setFilterTo] = useState<string>("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pickerSlot, setPickerSlot] = useState<{ day: Day; startMin: number; durationMin: number } | null>(null);
  const filterFromMin = filterFrom ? timeToMin(filterFrom) : null;
  const filterToMin = filterTo ? timeToMin(filterTo) : null;
  const activeFilterCount = (filterDays.length > 0 ? 1 : 0) + (filterFrom ? 1 : 0) + (filterTo ? 1 : 0);

  const instructorId = instructor?.id;

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Debounce search input (200ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedPrompt(aiPrompt), 200);
    return () => clearTimeout(t);
  }, [aiPrompt]);

  // ---- Fetch availability windows ----
  useEffect(() => {
    if (!instructorId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("availability_windows")
        .select("day_of_week, start_time, end_time, is_active")
        .eq("instructor_id", instructorId)
        .eq("is_active", true);
      if (cancelled || error || !data) return;
      const map: Record<Day, "off" | { start: string; end: string }> = {
        Mon: "off", Tue: "off", Wed: "off", Thu: "off", Fri: "off", Sat: "off", Sun: "off",
      };
      // Merge windows: take earliest start / latest end per day
      for (const w of data) {
        const day = dayFromDOW(w.day_of_week);
        const start = (w.start_time as string).slice(0, 5);
        const end = (w.end_time as string).slice(0, 5);
        const cur = map[day];
        if (cur === "off") map[day] = { start, end };
        else map[day] = { start: start < cur.start ? start : cur.start, end: end > cur.end ? end : cur.end };
      }
      setAvailability(map);
    })();
    return () => { cancelled = true; };
  }, [instructorId]);

  // ---- Fetch instructor settings (buffer, durations, booking rules) ----
  useEffect(() => {
    if (!instructorId) return;
    let cancelled = false;
    (async () => {
      const [{ data: ins }, { data: bs }] = await Promise.all([
        supabase.from("instructors")
          .select("buffer_minutes, preferred_lesson_length, allowed_lesson_lengths")
          .eq("id", instructorId).maybeSingle(),
        supabase.from("instructor_booking_settings")
          .select("allowed_durations, min_notice_hours")
          .eq("instructor_id", instructorId).maybeSingle(),
      ]);
      if (cancelled) return;
      if (ins) {
        setBufferMinutes(ins.buffer_minutes ?? 15);
        setPreferredDuration(ins.preferred_lesson_length ?? 60);
        if (ins.allowed_lesson_lengths?.length) setAllowedDurations(ins.allowed_lesson_lengths);
      }
      if (bs) {
        if (bs.allowed_durations?.length) setAllowedDurations(bs.allowed_durations);
        setMinNoticeHours(bs.min_notice_hours ?? 0);
      }
    })();
    return () => { cancelled = true; };
  }, [instructorId]);

  // ---- Fetch Google Calendar external busy events for the week ----
  const reloadExternalBusy = useCallback(async () => {
    if (!instructorId) return;
    const startISO = new Date(weekStart).toISOString();
    const endISO = new Date(addDays(weekStart, 7)).toISOString();
    const { data, error } = await supabase
      .from("instructor_calendar_events")
      .select("id, title, start_time, end_time, is_busy")
      .eq("instructor_id", instructorId)
      .eq("is_busy", true)
      .gte("start_time", startISO)
      .lt("start_time", endISO);
    if (error || !data) return;
    const mapped: Lesson[] = data.map((row: any) => {
      const s = new Date(row.start_time);
      const e = new Date(row.end_time);
      const startMin = s.getHours() * 60 + s.getMinutes();
      const durationMin = Math.max(15, Math.round((e.getTime() - s.getTime()) / 60000));
      return {
        id: `gcal-${row.id}`,
        pupilId: "",
        pupil: row.title || "Busy (Google)",
        day: JS_DAY[s.getDay()],
        startMin,
        durationMin,
        type: "standard" as LessonType,
      };
    });
    setExternalBusy(mapped);
  }, [instructorId, weekStart]);

  useEffect(() => { reloadExternalBusy(); }, [reloadExternalBusy]);

  // Realtime for external calendar events
  useEffect(() => {
    if (!instructorId) return;
    const ch = supabase
      .channel(`schedule-gcal-${instructorId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "instructor_calendar_events",
        filter: `instructor_id=eq.${instructorId}`,
      }, () => { reloadExternalBusy(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [instructorId, reloadExternalBusy]);
  useEffect(() => {
    if (!instructorId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("pupils")
        .select("id, name, next_lesson")
        .eq("instructor_id", instructorId)
        .is("deleted_at", null)
        .order("name", { ascending: true });
      if (cancelled || !data) return;
      const mapped: PupilLite[] = data.map((p: any) => ({
        id: p.id,
        name: p.name || "Unnamed",
        initials: initialsOf(p.name || ""),
        avatarColor: colorForId(p.id),
        lastLessonDays: null,
      }));
      setPupils(mapped);
    })();
    return () => { cancelled = true; };
  }, [instructorId]);

  // ---- Fetch lessons for current week ----
  const reloadLessons = useCallback(async () => {
    if (!instructorId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("scheduled_lessons")
      .select("id, pupil_id, lesson_date, start_time, duration_minutes, lesson_type, status, pupils(name)")
      .eq("instructor_id", instructorId)
      .gte("lesson_date", ymd(weekStart))
      .lte("lesson_date", ymd(weekEnd))
      .neq("status", "cancelled")
      .is("deleted_at", null);
    setLoading(false);
    if (error || !data) return;
    const mapped: Lesson[] = data.map((row: any) => {
      const date = new Date(row.lesson_date + "T00:00:00");
      return {
        id: row.id,
        pupilId: row.pupil_id,
        pupil: row.pupils?.name || "Pupil",
        day: JS_DAY[date.getDay()],
        startMin: timeToMin(row.start_time),
        durationMin: row.duration_minutes,
        type: lessonTypeFromString(row.lesson_type),
      };
    });
    setLessons(mapped);
  }, [instructorId, weekStart, weekEnd]);

  useEffect(() => { reloadLessons(); }, [reloadLessons]);

  // Live updates
  useEffect(() => {
    if (!instructorId) return;
    const ch = supabase
      .channel(`schedule-${instructorId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "scheduled_lessons",
        filter: `instructor_id=eq.${instructorId}`,
      }, () => { reloadLessons(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [instructorId, reloadLessons]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const totals = useMemo(() => {
    const count = lessons.length;
    const minutes = lessons.reduce((s, l) => s + l.durationMin, 0);
    const earnings = Math.round((minutes / 60) * 34);
    return { count, hours: (minutes / 60).toFixed(1), earnings };
  }, [lessons]);

  // ---- Open slot search (merges lessons + Google Calendar busy + buffer) ----
  const openSlots = useMemo(() => {
    const slots: { day: Day; startMin: number; endMin: number }[] = [];
    const merged = [...lessons, ...externalBusy];
    for (const day of DAYS) {
      const a = availability[day];
      if (a === "off") continue;
      const dayStart = timeToMin(a.start);
      const dayEnd = timeToMin(a.end);
      const dayBusy = merged
        .filter(l => l.day === day)
        .sort((x, y) => x.startMin - y.startMin);
      let cursor = dayStart;
      for (const l of dayBusy) {
        const blockStart = Math.max(dayStart, l.startMin - bufferMinutes);
        const blockEnd = Math.min(dayEnd, l.startMin + l.durationMin + bufferMinutes);
        if (blockStart > cursor) slots.push({ day, startMin: cursor, endMin: blockStart });
        cursor = Math.max(cursor, blockEnd);
      }
      if (cursor < dayEnd) slots.push({ day, startMin: cursor, endMin: dayEnd });
    }
    return slots;
  }, [lessons, externalBusy, availability, bufferMinutes]);

  const slotMatches = useMemo(() => {
    const q = debouncedPrompt.trim().toLowerCase();
    const hasQuery = q.length > 0;
    const hasFilters = filterDays.length > 0 || filterFromMin !== null || filterToMin !== null;
    if (!hasQuery && !hasFilters) return [];
    let needMin = preferredDuration || 60;
    if (hasQuery) {
      const hM = q.match(/(\d+(?:\.\d+)?)\s*h(?:r|rs|our|ours)?(?:\s*(\d+)\s*m)?/);
      const mM = q.match(/(\d+)\s*(?:m|min|mins|minutes)\b/);
      if (hM) needMin = Math.round(parseFloat(hM[1]) * 60) + (hM[2] ? parseInt(hM[2]) : 0);
      else if (mM) needMin = parseInt(mM[1]);
    }
    // Snap to nearest allowed duration if within 15min
    if (allowedDurations.length && !allowedDurations.includes(needMin)) {
      const closest = allowedDurations.reduce((a, b) => Math.abs(b - needMin) < Math.abs(a - needMin) ? b : a);
      if (Math.abs(closest - needMin) <= 15) needMin = closest;
    }
    const dayMap: Record<string, Day> = {
      mon: "Mon", monday: "Mon", tue: "Tue", tues: "Tue", tuesday: "Tue",
      wed: "Wed", weds: "Wed", wednesday: "Wed", thu: "Thu", thur: "Thu", thurs: "Thu", thursday: "Thu",
      fri: "Fri", friday: "Fri", sat: "Sat", saturday: "Sat", sun: "Sun", sunday: "Sun",
    };
    let queryDay: Day | null = null;
    if (hasQuery) for (const k of Object.keys(dayMap)) if (new RegExp(`\\b${k}\\b`).test(q)) { queryDay = dayMap[k]; break; }
    const morning = hasQuery && /\bmorning|am\b/.test(q);
    const afternoon = hasQuery && /\bafternoon|pm\b/.test(q);
    const evening = hasQuery && /\bevening\b/.test(q);

    // min_notice: cutoff = now + minNoticeHours
    const cutoff = new Date(now.getTime() + minNoticeHours * 3600_000);
    const slotIsAfterCutoff = (s: { day: Day; startMin: number }) => {
      const d = addDays(weekStart, DAYS.indexOf(s.day));
      const slotDate = new Date(d);
      slotDate.setHours(Math.floor(s.startMin / 60), s.startMin % 60, 0, 0);
      return slotDate >= cutoff;
    };

    return openSlots
      .filter(s => s.endMin - s.startMin >= needMin)
      .filter(slotIsAfterCutoff)
      .filter(s => !queryDay || s.day === queryDay)
      .filter(s => filterDays.length === 0 || filterDays.includes(s.day))
      .filter(s => {
        if (morning) return s.startMin < 12 * 60;
        if (afternoon) return s.startMin >= 12 * 60 && s.startMin < 17 * 60;
        if (evening) return s.startMin >= 17 * 60;
        return true;
      })
      .filter(s => filterFromMin === null || s.startMin >= filterFromMin)
      .filter(s => filterToMin === null || s.startMin + needMin <= filterToMin)
      .slice(0, 12)
      .map(s => ({ ...s, needMin }));
  }, [debouncedPrompt, openSlots, filterDays, filterFromMin, filterToMin, preferredDuration, allowedDurations, minNoticeHours, now, weekStart]);

  const handleSignOut = async () => { await signOut(); navigate("/instructor-app/login"); };
  const initials = (instructor?.name || "").split(" ").map(s => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "ID";

  // ---- Booking persistence ----
  const dayIndex = (d: Day) => DAYS.indexOf(d);
  const dateForDay = (d: Day): Date => addDays(weekStart, dayIndex(d));

  const bookLesson = useCallback(async (pupilId: string, pupilName: string, day: Day, startMin: number, durationMin = 60) => {
    if (!instructorId) return;
    const date = dateForDay(day);
    const startTime = `${String(Math.floor(startMin / 60)).padStart(2, "0")}:${String(startMin % 60).padStart(2, "0")}:00`;
    const { error } = await supabase.from("scheduled_lessons").insert({
      instructor_id: instructorId,
      pupil_id: pupilId,
      lesson_date: ymd(date),
      start_time: startTime,
      duration_minutes: durationMin,
      lesson_type: "Standard Lesson",
      status: "confirmed",
    });
    if (error) { toast.error(`Could not book: ${error.message}`); return; }
    toast.success(`Booked · ${pupilName} ${day} ${fmtTime(startMin)}`);
    reloadLessons();
  }, [instructorId, weekStart, reloadLessons]);

  const moveLesson = useCallback(async (lesson: Lesson, day: Day, startMin: number) => {
    const date = dateForDay(day);
    const startTime = `${String(Math.floor(startMin / 60)).padStart(2, "0")}:${String(startMin % 60).padStart(2, "0")}:00`;
    // Optimistic update
    setLessons(ls => ls.map(l => l.id === lesson.id ? { ...l, day, startMin } : l));
    const { error } = await supabase.from("scheduled_lessons")
      .update({ lesson_date: ymd(date), start_time: startTime })
      .eq("id", lesson.id);
    if (error) {
      toast.error(`Move failed: ${error.message}`);
      reloadLessons();
      return;
    }
    toast(`Moved to ${day} ${fmtTime(startMin)}`);
  }, [weekStart, reloadLessons]);

  // ---- DnD handlers ----
  function onDragStart(e: DragStartEvent) {
    const data = e.active.data.current as any;
    if (data?.kind === "pupil") setActiveDrag({ kind: "pupil", pupil: data.pupil });
    else if (data?.kind === "lesson") setActiveDrag({ kind: "lesson", lesson: data.lesson });
  }

  function onDragEnd(e: DragEndEvent) {
    const drag = activeDrag;
    setActiveDrag(null);
    if (!drag || !e.over) return;
    const overData = e.over.data.current as any;
    if (!overData?.day) return;
    const day = overData.day as Day;
    if (availability[day] === "off") return;

    const rect = (e.over.rect as any) as DOMRect;
    const pointerY = e.activatorEvent && "clientY" in e.activatorEvent
      ? (e.activatorEvent as PointerEvent).clientY + (e.delta?.y ?? 0)
      : rect.top;
    const offsetMin = Math.max(0, Math.round(((pointerY - rect.top) / HOUR_PX) * 60 / 15) * 15);
    const startMin = HOUR_START * 60 + offsetMin;

    if (drag.kind === "pupil") {
      bookLesson(drag.pupil.id, drag.pupil.name, day, startMin, 60);
    } else {
      moveLesson(drag.lesson, day, startMin);
    }
  }

  return (
    <DashboardShell
      userInitials={initials}
      userName={instructor?.name || "Instructor"}
      notificationCount={notificationCount}
      onSignOut={handleSignOut}
      onAskED={() => window.dispatchEvent(new CustomEvent("dsm:open-ai"))}
      onBell={() => navigate("/instructor/notifications")}
    >
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex flex-col" style={{ gap: 0, padding: 0, margin: -8 }}>
          {/* Toolbar */}
          <div className="flex items-center" style={{ gap: 10, marginBottom: 14 }}>
            <button style={iconBtn}><ChevronLeft size={13} /></button>
            <button style={iconBtn}><ChevronRight size={13} /></button>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--d2-text-1)" }}>May 4 – 10, 2026</div>
            <button style={{ ...outlinePill }}>Today</button>
            <div style={{ flex: 1 }} />
            <div className="flex items-center" style={{ background: "#F1F5F9", borderRadius: 8, padding: 3, gap: 2 }}>
              {(["day", "week", "month", "agenda"] as View[]).map(v => {
                const a = v === view;
                return (
                  <button key={v} onClick={() => setView(v)}
                    style={{
                      padding: "4px 10px", borderRadius: 6, fontSize: 11,
                      background: a ? "#fff" : "transparent",
                      color: a ? "var(--d2-text-1)" : "var(--d2-text-2)",
                      fontWeight: a ? 500 : 400, textTransform: "capitalize",
                      boxShadow: a ? "0 1px 2px rgba(15,23,42,0.06)" : "none",
                    }}>{v}</button>
                );
              })}
            </div>
            <div style={{ position: "relative" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8,
                padding: "5px 9px", minWidth: 240,
              }}>
                <Search size={11} style={{ color: "var(--d2-text-2)" }} />
                <input
                  type="search"
                  placeholder='Find a slot — try "2h Tue morning"'
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  style={{
                    flex: 1, border: "none", outline: "none", background: "transparent",
                    fontSize: 11, color: "var(--d2-text-1)",
                  }}
                />
                <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      title="Filters"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        fontSize: 10, color: activeFilterCount ? "#4F46E5" : "var(--d2-text-2)",
                        background: activeFilterCount ? "#EEF2FF" : "transparent",
                        borderRadius: 6, padding: "2px 6px", fontWeight: 500,
                      }}
                    >
                      <Filter size={10} />
                      {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-64 p-3 space-y-3">
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--d2-text-2)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                        Days
                      </div>
                      <div className="flex flex-wrap" style={{ gap: 4 }}>
                        {DAYS.map(d => {
                          const active = filterDays.includes(d);
                          return (
                            <button
                              key={d}
                              onClick={() => setFilterDays(prev => active ? prev.filter(x => x !== d) : [...prev, d])}
                              style={{
                                fontSize: 10, padding: "4px 8px", borderRadius: 999,
                                border: "1px solid " + (active ? "#4F46E5" : "#E2E8F0"),
                                background: active ? "#EEF2FF" : "#fff",
                                color: active ? "#4F46E5" : "var(--d2-text-2)",
                                fontWeight: active ? 600 : 400,
                              }}
                            >
                              {d}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--d2-text-2)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                        Time range
                      </div>
                      <div className="flex items-center" style={{ gap: 6 }}>
                        <input
                          type="time"
                          value={filterFrom}
                          onChange={e => setFilterFrom(e.target.value)}
                          style={{
                            flex: 1, fontSize: 11, padding: "5px 7px",
                            border: "1px solid #E2E8F0", borderRadius: 6, background: "#fff",
                          }}
                        />
                        <span style={{ fontSize: 11, color: "var(--d2-text-3)" }}>to</span>
                        <input
                          type="time"
                          value={filterTo}
                          onChange={e => setFilterTo(e.target.value)}
                          style={{
                            flex: 1, fontSize: 11, padding: "5px 7px",
                            border: "1px solid #E2E8F0", borderRadius: 6, background: "#fff",
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between" style={{ paddingTop: 4 }}>
                      <button
                        onClick={() => { setFilterDays([]); setFilterFrom(""); setFilterTo(""); }}
                        style={{ fontSize: 11, color: "var(--d2-text-2)" }}
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => setFiltersOpen(false)}
                        style={{
                          fontSize: 11, padding: "5px 10px", borderRadius: 6,
                          background: "#4F46E5", color: "#fff", fontWeight: 500,
                        }}
                      >
                        Done
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              {(aiPrompt.trim() || activeFilterCount > 0) && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 30,
                  width: 300, background: "#fff", border: "1px solid #E2E8F0",
                  borderRadius: 10, boxShadow: "0 8px 24px rgba(15,23,42,0.10)",
                  padding: 6, maxHeight: 320, overflowY: "auto",
                }}>
                  {slotMatches.length === 0 ? (
                    <div style={{ fontSize: 11, color: "var(--d2-text-2)", padding: "8px 10px" }}>
                      No matching slots this week.
                    </div>
                  ) : slotMatches.map((s, i) => (
                    <button
                      key={`${s.day}-${s.startMin}-${i}`}
                      onClick={() => {
                        setPickerSlot({ day: s.day, startMin: s.startMin, durationMin: s.needMin });
                        setAiPrompt("");
                      }}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        width: "100%", textAlign: "left", padding: "7px 10px",
                        borderRadius: 6, fontSize: 11, color: "var(--d2-text-1)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ fontWeight: 500 }}>{s.day} · {fmtTime(s.startMin)}</span>
                      <span style={{ color: "var(--d2-text-3)", fontFamily: "var(--d2-mono)" }}>
                        {Math.round((s.endMin - s.startMin))}m free
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button style={{
              fontSize: 11, padding: "6px 10px", borderRadius: 8,
              background: "#4F46E5", color: "#fff", fontWeight: 500,
              display: "inline-flex", alignItems: "center", gap: 5,
            }}>
              <Plus size={12} /> New lesson
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center" style={{ gap: 12, marginBottom: 12, fontSize: 10, color: "var(--d2-text-2)" }}>
            {(Object.keys(TYPE_COLOR) as LessonType[]).map(t => (
              <div key={t} className="flex items-center" style={{ gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: TYPE_COLOR[t].line }} />
                <span>{TYPE_COLOR[t].label}</span>
              </div>
            ))}
          </div>

          {/* Calendar */}
          {view === "week" && (
            <WeekGrid
              lessons={lessons}
              externalBusy={externalBusy}
              now={now}
              onSelectLesson={setSelectedLesson}
              weekStart={weekStart}
              todayDay={todayDay}
              availability={availability}
            />
          )}
          {view === "day" && <PlaceholderView text="Day view — single column with 30-min rows." />}
          {view === "month" && <PlaceholderView text="Month view — compact bars per cell." />}
          {view === "agenda" && <AgendaView lessons={lessons} />}

          {/* Footer summary */}
          <div className="flex items-center" style={{
            background: "#F8FAFC", borderRadius: 8, padding: "10px 12px",
            marginTop: 12, gap: 16, fontSize: 11, color: "var(--d2-text-2)",
          }}>
            <span><span style={{ color: "var(--d2-text-3)" }}>This week:</span> <strong style={{ color: "var(--d2-text-1)", fontWeight: 600 }}>{totals.count} lessons</strong></span>
            <span><span style={{ color: "var(--d2-text-3)" }}>Hours:</span> <strong style={{ color: "var(--d2-text-1)", fontWeight: 600, fontFamily: "var(--d2-mono)" }}>{totals.hours}</strong></span>
            <span><span style={{ color: "var(--d2-text-3)" }}>Earnings:</span> <strong style={{ color: "var(--d2-text-1)", fontWeight: 600, fontFamily: "var(--d2-mono)" }}>£{totals.earnings}</strong></span>
            <div style={{ flex: 1 }} />
            <button style={{ color: "#4F46E5", fontWeight: 500 }}>Open slots: 8 →</button>
          </div>
        </div>

        <DragOverlay>
          {activeDrag?.kind === "pupil" && (
            <div style={{
              background: "#fff", border: "0.5px solid var(--d2-border)", borderRadius: 6,
              padding: "7px 8px", display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 11, fontWeight: 500, boxShadow: "0 6px 16px rgba(15,23,42,0.12)",
            }}>
              <Avatar color={activeDrag.pupil.avatarColor} initials={activeDrag.pupil.initials} />
              {activeDrag.pupil.name}
            </div>
          )}
          {activeDrag?.kind === "lesson" && <LessonGhost lesson={activeDrag.lesson} />}
        </DragOverlay>
      </DndContext>

      {/* Lesson popover */}
      {selectedLesson && (
        <div onClick={() => setSelectedLesson(null)} style={{
          position: "fixed", inset: 0, zIndex: 50, background: "rgba(15,23,42,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 10, padding: 16, width: 320,
            boxShadow: "0 20px 40px rgba(15,23,42,0.2)",
          }}>
            <div className="flex items-center" style={{ gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: TYPE_COLOR[selectedLesson.type].bg,
                color: TYPE_COLOR[selectedLesson.type].text,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 600,
              }}>{selectedLesson.pupil.split(" ").map(s => s[0]).join("")}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{selectedLesson.pupil}</div>
                <div style={{ fontSize: 11, color: "var(--d2-text-3)" }}>
                  {selectedLesson.day} · {fmtTime(selectedLesson.startMin)} · {selectedLesson.durationMin}m · {TYPE_COLOR[selectedLesson.type].label}
                </div>
              </div>
            </div>
            <div className="flex" style={{ gap: 6, marginTop: 12 }}>
              <button style={smallBtn}>Edit</button>
              <button style={smallBtn}>Cancel</button>
              <button style={{ ...smallBtn, background: "#4F46E5", color: "#fff", border: "none" }}>Mark complete</button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

const iconBtn: React.CSSProperties = {
  width: 24, height: 24, borderRadius: 5, border: "0.5px solid var(--d2-border)",
  background: "#fff", color: "var(--d2-text-2)",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
};

const outlinePill: React.CSSProperties = {
  fontSize: 11, padding: "5px 10px", borderRadius: 8,
  border: "0.5px solid var(--d2-border)", background: "#fff",
  color: "var(--d2-text-2)",
};

const smallBtn: React.CSSProperties = {
  fontSize: 11, padding: "5px 10px", borderRadius: 6,
  border: "0.5px solid var(--d2-border)", background: "#fff",
  color: "var(--d2-text-1)", flex: 1,
};

// ---- Week grid ----
function WeekGrid({
  lessons, externalBusy = [], now, onSelectLesson, weekStart, todayDay, availability,
}: {
  lessons: Lesson[]; externalBusy?: Lesson[]; now: Date; onSelectLesson: (l: Lesson) => void;
  weekStart: Date; todayDay: Day;
  availability: Record<Day, "off" | { start: string; end: string }>;
}) {
  const rows = HOUR_END - HOUR_START + 1;
  const dates = DAYS.map((_, i) => String(addDays(weekStart, i).getDate()));
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowTop = ((nowMin - HOUR_START * 60) / 60) * HOUR_PX;

  return (
    <div style={{
      background: "#fff", border: "0.5px solid var(--d2-border)", borderRadius: 6,
      overflow: "hidden",
    }}>
      <div style={{
        display: "grid", gridTemplateColumns: "38px repeat(7, 1fr)",
        background: "#F8FAFC", borderBottom: "0.5px solid var(--d2-border)",
      }}>
        <div />
        {DAYS.map((d, i) => {
          const isToday = d === todayDay;
          return (
            <div key={d} style={{
              padding: 7, textAlign: "center",
              background: isToday ? "#EEF2FF" : "transparent",
              borderLeft: "0.5px solid var(--d2-border)",
            }}>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.5px", color: isToday ? "#4338CA" : "var(--d2-text-3)" }}>{d}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: isToday ? "#4338CA" : "var(--d2-text-1)" }}>{dates[i]}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "38px repeat(7, 1fr)" }}>
        <div>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} style={{
              height: HOUR_PX, padding: "4px 6px", textAlign: "right",
              fontSize: 9, color: "var(--d2-text-3)",
              borderBottom: "0.5px solid var(--d2-border)",
            }}>
              {String(HOUR_START + i).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {DAYS.map(d => (
          <DayColumn
            key={d}
            day={d}
            rows={rows}
            lessons={lessons.filter(l => l.day === d)}
            externalBusy={externalBusy.filter(l => l.day === d)}
            isToday={d === todayDay}
            nowTop={nowTop}
            onSelectLesson={onSelectLesson}
            off={availability[d] === "off"}
          />
        ))}
      </div>
    </div>
  );
}

function DayColumn({
  day, rows, lessons, externalBusy = [], isToday, nowTop, onSelectLesson, off,
}: {
  day: Day; rows: number; lessons: Lesson[]; externalBusy?: Lesson[]; isToday: boolean; nowTop: number;
  onSelectLesson: (l: Lesson) => void; off: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${day}`, data: { day }, disabled: off });
  const height = rows * HOUR_PX;

  return (
    <div
      ref={setNodeRef}
      style={{
        position: "relative", height,
        borderLeft: "0.5px solid var(--d2-border)",
        background: off
          ? "repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(15,23,42,0.025) 6px, rgba(15,23,42,0.025) 12px)"
          : isToday ? "#FAFBFF" : "transparent",
        boxShadow: isOver && !off ? "inset 0 0 0 2px rgba(79,70,229,0.25)" : "none",
        transition: "box-shadow 120ms",
      }}
    >
      {/* Hour grid lines */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          position: "absolute", left: 0, right: 0, top: i * HOUR_PX, height: HOUR_PX,
          borderBottom: "0.5px solid var(--d2-border)",
        }} />
      ))}

      {off && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, color: "var(--d2-text-3)", fontWeight: 500,
          letterSpacing: "0.5px", textTransform: "uppercase",
        }}>Day off</div>
      )}

      {!off && externalBusy.map(l => {
        const top = ((l.startMin - HOUR_START * 60) / 60) * HOUR_PX;
        const h = (l.durationMin / 60) * HOUR_PX - 2;
        if (h <= 0) return null;
        return (
          <div key={l.id} title={`Google Calendar: ${l.pupil}`} style={{
            position: "absolute", top, left: 2, right: 2, height: h,
            borderRadius: 4, padding: "3px 5px", overflow: "hidden",
            background: "repeating-linear-gradient(45deg, rgba(100,116,139,0.10), rgba(100,116,139,0.10) 4px, rgba(100,116,139,0.18) 4px, rgba(100,116,139,0.18) 8px)",
            border: "0.5px dashed rgba(71,85,105,0.5)",
            fontSize: 9, color: "#334155", lineHeight: 1.1,
          }}>
            <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {l.pupil}
            </div>
            {h > 22 && <div style={{ opacity: 0.7 }}>Google · {fmtTime(l.startMin)}</div>}
          </div>
        );
      })}

      {!off && lessons.map(l => (
        <LessonCard
          key={l.id} lesson={l}
          onClick={() => onSelectLesson(l)}
        />
      ))}

      {isToday && nowTop >= 0 && nowTop <= height && (
        <div style={{
          position: "absolute", left: 0, right: 0, top: nowTop, height: 1,
          background: "#4F46E5", zIndex: 5,
        }}>
          <div style={{
            position: "absolute", left: -3, top: -3, width: 7, height: 7,
            borderRadius: "50%", background: "#4F46E5",
          }} />
        </div>
      )}
    </div>
  );
}

function LessonCard({ lesson, onClick }: { lesson: Lesson; onClick: () => void }) {
  const c = TYPE_COLOR[lesson.type];
  const top = ((lesson.startMin - HOUR_START * 60) / 60) * HOUR_PX;
  const height = (lesson.durationMin / 60) * HOUR_PX - 2;
  const isShort = lesson.durationMin < 45;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `lesson-${lesson.id}`, data: { kind: "lesson", lesson },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes} {...listeners}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        position: "absolute", top, left: 2, right: 2, height,
        background: c.bg, borderLeft: `2px solid ${c.line}`, borderRadius: 4,
        padding: "3px 5px", overflow: "hidden", cursor: "grab",
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 500, color: c.text, lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {lesson.pupil}
      </div>
      {!isShort && (
        <div style={{ fontSize: 9, color: c.text, opacity: 0.8 }}>
          {fmtTime(lesson.startMin)} · {lesson.durationMin >= 60 ? `${(lesson.durationMin / 60).toFixed(lesson.durationMin % 60 ? 1 : 0)}h` : `${lesson.durationMin}m`}
        </div>
      )}
      {!isShort && height > 50 && lesson.type !== "standard" && (
        <div style={{ fontSize: 9, color: c.text, opacity: 0.7, marginTop: 1 }}>{c.label}</div>
      )}
    </div>
  );
}

function LessonGhost({ lesson }: { lesson: Lesson }) {
  const c = TYPE_COLOR[lesson.type];
  return (
    <div style={{
      width: 140, background: c.bg, borderLeft: `2px solid ${c.line}`,
      borderRadius: 4, padding: "4px 6px",
      boxShadow: "0 6px 16px rgba(15,23,42,0.12)",
      fontSize: 10, fontWeight: 500, color: c.text,
    }}>
      {lesson.pupil}
      <div style={{ fontSize: 9, opacity: 0.8 }}>{fmtTime(lesson.startMin)}</div>
    </div>
  );
}

// ---- Right rail ----
function RightRail({
  unbooked, aiPrompt, setAiPrompt, aiSuggestions, onAskAi,
}: {
  unbooked: PupilLite[];
  aiPrompt: string; setAiPrompt: (s: string) => void;
  aiSuggestions: { label: string }[] | null;
  onAskAi: () => void;
}) {
  return (
    <aside style={{
      width: 280, flexShrink: 0,
      background: "#F8FAFC", borderLeft: "0.5px solid var(--d2-border)",
      padding: "16px 12px", display: "flex", flexDirection: "column", gap: 16,
    }}>
      <section>
        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--d2-text-3)", fontWeight: 500 }}>
          Drag to schedule
        </div>
        <div style={{ fontSize: 10, color: "var(--d2-text-2)", marginTop: 2, marginBottom: 8 }}>
          Pupils with no lesson booked this week.
        </div>
        <div className="flex flex-col" style={{ gap: 6 }}>
          {unbooked.map(p => <PupilChip key={p.id} pupil={p} />)}
        </div>
      </section>

      <section style={{ background: "#fff", borderRadius: 8, padding: 10, border: "0.5px solid var(--d2-border)" }}>
        <div className="flex items-center" style={{ gap: 5 }}>
          <Sparkles size={12} color="#4F46E5" />
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--d2-text-1)" }}>Find me a slot</div>
        </div>
        <div style={{ fontSize: 10, color: "var(--d2-text-2)", marginTop: 4 }}>
          Tell ED what you need. e.g. "Sarah needs 2h next week, mornings only".
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onAskAi(); }}>
          <input
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            placeholder="Type a request..."
            style={{
              marginTop: 8, width: "100%", fontSize: 11,
              background: "#F8FAFC", border: "0.5px solid var(--d2-border)",
              borderRadius: 6, padding: "6px 8px", outline: "none",
            }}
          />
        </form>
        {aiSuggestions && (
          <div className="flex flex-col" style={{ gap: 4, marginTop: 8 }}>
            {aiSuggestions.map(s => (
              <button key={s.label}
                onClick={() => toast(`Booked ${s.label}`)}
                style={{
                  textAlign: "left", fontSize: 11, padding: "5px 8px",
                  borderRadius: 6, background: "#EEF2FF", color: "#4338CA",
                }}>
                {s.label}
              </button>
            ))}
          </div>
        )}
      </section>
    </aside>
  );
}

function PupilChip({ pupil }: { pupil: PupilLite }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `pupil-${pupil.id}`, data: { kind: "pupil", pupil },
  });
  return (
    <div
      ref={setNodeRef} {...attributes} {...listeners}
      style={{
        background: "#fff", border: "0.5px solid var(--d2-border)", borderRadius: 6,
        padding: "7px 8px", display: "flex", alignItems: "center", gap: 8,
        cursor: isDragging ? "grabbing" : "grab",
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <Avatar color={pupil.avatarColor} initials={pupil.initials} />
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 11, fontWeight: 500, color: "var(--d2-text-1)" }}>{pupil.name}</div>
        <div style={{ fontSize: 9, color: "var(--d2-text-3)" }}>Last: {pupil.lastLessonDays}d ago</div>
      </div>
      <GripVertical size={12} color="var(--d2-text-3)" />
    </div>
  );
}

function Avatar({ color, initials }: { color: string; initials: string }) {
  const c = palette[color] || palette.gray;
  return (
    <div style={{
      width: 24, height: 24, borderRadius: "50%",
      background: c.bg, color: c.text,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 10, fontWeight: 600, flexShrink: 0,
    }}>{initials}</div>
  );
}

// ---- Other views (light) ----
function PlaceholderView({ text }: { text: string }) {
  return (
    <div style={{
      background: "#fff", border: "0.5px solid var(--d2-border)", borderRadius: 6,
      padding: 48, textAlign: "center", fontSize: 12, color: "var(--d2-text-3)",
    }}>
      {text}
    </div>
  );
}

function AgendaView({ lessons }: { lessons: Lesson[] }) {
  const grouped: Record<string, Lesson[]> = {};
  DAYS.forEach(d => {
    const list = lessons.filter(l => l.day === d).sort((a, b) => a.startMin - b.startMin);
    if (list.length) grouped[d] = list;
  });
  return (
    <div style={{ background: "#fff", border: "0.5px solid var(--d2-border)", borderRadius: 6 }}>
      {Object.entries(grouped).map(([d, list]) => {
        const total = list.reduce((s, l) => s + l.durationMin, 0);
        return (
          <div key={d} style={{ borderBottom: "0.5px solid var(--d2-border)" }}>
            <div className="flex items-center justify-between" style={{ padding: "8px 12px", background: "#F8FAFC" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--d2-text-1)" }}>{d}</div>
              <div style={{ fontSize: 10, color: "var(--d2-text-3)", fontFamily: "var(--d2-mono)" }}>{(total / 60).toFixed(1)}h</div>
            </div>
            {list.map(l => {
              const c = TYPE_COLOR[l.type];
              return (
                <div key={l.id} className="flex items-center" style={{ gap: 10, padding: "8px 12px", borderTop: "0.5px solid var(--d2-border)" }}>
                  <div style={{ fontSize: 11, fontFamily: "var(--d2-mono)", color: "var(--d2-text-2)", width: 50 }}>{fmtTime(l.startMin)}</div>
                  <div style={{ fontSize: 11, fontWeight: 500, flex: 1 }}>{l.pupil}</div>
                  <span style={{
                    fontSize: 9, padding: "1px 6px", borderRadius: 6,
                    background: c.bg, color: c.text, textTransform: "uppercase", letterSpacing: "0.4px",
                  }}>{c.label}</span>
                  <div style={{ fontSize: 10, color: "var(--d2-text-3)", fontFamily: "var(--d2-mono)" }}>{l.durationMin}m</div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
