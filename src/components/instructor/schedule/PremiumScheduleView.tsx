import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { format, addDays, isToday, isTomorrow, parseISO, startOfDay, startOfWeek, isSameDay, differenceInMinutes } from "date-fns";
import { Menu, RefreshCw, Clock, Car, MapPin, Info, Plus, Phone, MessageSquare, Navigation, Users, CheckCircle, AlertTriangle, CalendarX, Wifi, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PupilAvatar } from "../PupilAvatar";
import { AddLessonSheet } from "../AddLessonSheet";
import { ExpandableLessonCard } from "../ExpandableLessonCard";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { haptics } from "@/lib/haptics";

// ─── Types ───
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

interface PremiumScheduleViewProps {
  instructorId: string;
  onMenuClick?: () => void;
}

// ─── Constants ───
const VIEW_MODES = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
] as const;

type ViewMode = typeof VIEW_MODES[number]["value"];

const lessonTypeConfig: Record<string, { label: string; color: string; tint: string; textColor: string }> = {
  standard: { label: "Standard", color: "#2563EB", tint: "#DBEAFE", textColor: "#1E40AF" },
  test_prep: { label: "Test Prep", color: "#F59E0B", tint: "#FEF3C7", textColor: "#92400E" },
  mock_test: { label: "Mock Test", color: "#EF4444", tint: "#FEE2E2", textColor: "#991B1B" },
  motorway: { label: "Motorway", color: "#16A34A", tint: "#DCFCE7", textColor: "#166534" },
  refresher: { label: "Refresher", color: "#06B6D4", tint: "#CFFAFE", textColor: "#155E75" },
  intensive: { label: "Intensive", color: "#7C3AED", tint: "#EDE9FE", textColor: "#5B21B6" },
  first_lesson: { label: "Beginner", color: "#22C55E", tint: "#DCFCE7", textColor: "#166534" },
  pass_plus: { label: "Pass Plus", color: "#6366F1", tint: "#E0E7FF", textColor: "#3730A3" },
  driving_test: { label: "Driving Test", color: "#F97316", tint: "#FFEDD5", textColor: "#9A3412" },
};

const formatTime = (t: string) => {
  const [h, m] = t.split(":");
  return `${h}:${m}`;
};

const getEndTime = (start: string, mins: number) => {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

const getInitials = (name: string) => {
  const parts = name.split(" ");
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
};

// ─── Component ───
export function PremiumScheduleView({ instructorId, onMenuClick }: PremiumScheduleViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [lessons, setLessons] = useState<ScheduledLesson[]>([]);
  const [externalEvents, setExternalEvents] = useState<ExternalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [addLessonOpen, setAddLessonOpen] = useState(false);
  const [addLessonDate, setAddLessonDate] = useState<Date | undefined>(undefined);
  const dayStripRef = useRef<HTMLDivElement>(null);

  // ─── Day strip data (7 days centered on selected) ───
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  // ─── Fetch lessons ───
  const fetchData = useCallback(async () => {
    setLoading(true);
    const from = format(addDays(selectedDate, -30), "yyyy-MM-dd");
    const to = format(addDays(selectedDate, 30), "yyyy-MM-dd");
    const fromISO = addDays(selectedDate, -30).toISOString();
    const toISO = addDays(selectedDate, 30).toISOString();

    try {
      const [lessonsRes, externalRes] = await Promise.all([
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
      ]);

      setLessons(
        (lessonsRes.data || []).map((l: any) => ({
          ...l,
          pupil: l.pupil || { id: "", name: "Unknown", phone: null, address: "", postcode: "", prepaid_hours: 0, account_balance: 0, profile_image_url: null },
        }))
      );

      setExternalEvents(
        (externalRes.data || []).map((e: any) => {
          const start = parseISO(e.start_time);
          const end = parseISO(e.end_time);
          return {
            id: e.id,
            title: e.title || "Busy",
            start_time: format(start, "HH:mm"),
            end_time: format(end, "HH:mm"),
            color: e.color,
            is_all_day: differenceInMinutes(end, start) >= 1380,
          };
        })
      );
    } catch (err) {
      console.error("Failed to fetch schedule data:", err);
    } finally {
      setLoading(false);
    }
  }, [instructorId, selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Sync handler ───
  const handleSync = async () => {
    setIsSyncing(true);
    haptics.light();
    try {
      await supabase.functions.invoke("google-calendar-service", {
        body: { action: "fetchExternalEvents", instructorId },
      });
      await fetchData();
      setLastSyncTime(new Date());
      toast.success("Calendar synced");
    } catch {
      toast.error("Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  // ─── Filter data for selected day ───
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");

  const dayLessons = useMemo(
    () => lessons.filter((l) => l.lesson_date === selectedDateStr).sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [lessons, selectedDateStr]
  );

  const dayExternalEvents = useMemo(
    () => externalEvents.filter((e) => {
      // Match external events that don't have a parseable date in start_time to selectedDate
      return true; // They're already filtered by range; we show all for now
    }),
    [externalEvents, selectedDateStr]
  );

  // ─── Day indicators (which days have lessons) ───
  const daysWithLessons = useMemo(() => {
    const set = new Set<string>();
    lessons.forEach((l) => set.add(l.lesson_date));
    return set;
  }, [lessons]);

  const totalHours = useMemo(
    () => dayLessons.reduce((sum, l) => sum + l.duration_minutes, 0) / 60,
    [dayLessons]
  );

  // ─── Gap detection ───
  const gaps = useMemo(() => {
    if (dayLessons.length < 2) return [];
    const result: { startTime: string; endTime: string; gapMinutes: number; index: number }[] = [];
    for (let i = 0; i < dayLessons.length - 1; i++) {
      const endOfCurrent = getEndTime(dayLessons[i].start_time, dayLessons[i].duration_minutes);
      const startOfNext = dayLessons[i + 1].start_time;
      const [eh, em] = endOfCurrent.split(":").map(Number);
      const [sh, sm] = startOfNext.split(":").map(Number);
      const gapMins = (sh * 60 + sm) - (eh * 60 + em);
      if (gapMins >= 120) {
        result.push({ startTime: endOfCurrent, endTime: startOfNext, gapMinutes: gapMins, index: i + 1 });
      }
    }
    return result;
  }, [dayLessons]);

  // ─── Sync status ───
  const syncStatus = useMemo(() => {
    if (!lastSyncTime) return "stale";
    const diff = Date.now() - lastSyncTime.getTime();
    if (diff < 60000) return "fresh";
    if (diff < 300000) return "stale";
    return "old";
  }, [lastSyncTime]);

  const syncDotColor = syncStatus === "fresh" ? "bg-emerald-500" : syncStatus === "stale" ? "bg-amber-400" : "bg-red-400";

  // ─── Render ───
  return (
    <div className="flex flex-col h-full bg-[#F7F8FA] dark:bg-[#0F172A]">
      {/* ═══ Sticky Header ═══ */}
      <div className="sticky top-0 z-30 bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#334155]">
        {/* Top row */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <button
            onClick={onMenuClick}
            className="w-9 h-9 rounded-[10px] bg-[#F1F5F9] dark:bg-[#334155] flex items-center justify-center active:scale-95 transition-transform"
          >
            <Menu className="h-[18px] w-[18px] text-[#334155] dark:text-[#94A3B8]" />
          </button>

          <div className="text-center">
            <p className="text-[11px] font-semibold tracking-[0.5px] uppercase text-[#64748B] dark:text-[#94A3B8]">
              Schedule
            </p>
            <p className="text-[17px] font-medium text-[#0F172A] dark:text-white">
              {format(selectedDate, "MMMM yyyy")}
            </p>
          </div>

          <div className="relative">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="w-9 h-9 rounded-[10px] bg-[#F1F5F9] dark:bg-[#334155] flex items-center justify-center active:scale-95 transition-transform"
            >
              <RefreshCw className={cn("h-[18px] w-[18px] text-[#334155] dark:text-[#94A3B8]", isSyncing && "animate-spin")} />
            </button>
            <span className={cn("absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full", syncDotColor)} />
          </div>
        </div>

        {/* Segmented control */}
        <div className="mx-4 mt-2 mb-2">
          <div className="flex bg-[#F1F3F7] dark:bg-[#1E293B] rounded-[10px] p-1 relative">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => {
                  haptics.selection();
                  setViewMode(mode.value);
                }}
                className={cn(
                  "flex-1 py-1.5 text-[13px] font-medium rounded-[8px] transition-all relative z-10",
                  viewMode === mode.value
                    ? "text-[#0F172A] dark:text-white bg-white dark:bg-[#334155] shadow-sm"
                    : "text-[#64748B]"
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Day strip */}
        <div ref={dayStripRef} className="flex justify-around px-2 pb-2">
          {weekDays.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const isSelected = isSameDay(day, selectedDate);
            const hasLessons = daysWithLessons.has(dateStr);
            const today = isToday(day);

            return (
              <button
                key={dateStr}
                onClick={() => {
                  haptics.selection();
                  setSelectedDate(day);
                }}
                className={cn(
                  "flex flex-col items-center w-11 py-1.5 rounded-[12px] transition-all",
                  isSelected ? "bg-[#2563EB]" : "bg-transparent"
                )}
              >
                <span className={cn(
                  "text-[10px] font-semibold uppercase tracking-wide",
                  isSelected ? "text-white/80" : "text-[#94A3B8]"
                )}>
                  {format(day, "EEE")}
                </span>
                <span className={cn(
                  "text-[15px] font-medium mt-0.5",
                  isSelected ? "text-white" : today ? "text-[#2563EB]" : "text-[#0F172A] dark:text-white"
                )}>
                  {format(day, "d")}
                </span>
                {/* Dot indicator */}
                <div className="h-1.5 mt-0.5">
                  {hasLessons && (
                    <span className={cn(
                      "block w-[5px] h-[5px] rounded-full",
                      isSelected ? "bg-[#FCD34D]" : "bg-[#2563EB]"
                    )} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ Content ═══ */}
      <div className="flex-1 overflow-auto px-4 pt-4 pb-24">
        {/* Day section header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[16px] font-medium text-[#0F172A] dark:text-white">
              {format(selectedDate, "EEEE, d MMMM")}
            </p>
            <p className="text-[12px] text-[#64748B] mt-0.5">
              {dayLessons.length === 0
                ? "No lessons"
                : `${dayLessons.length} lesson${dayLessons.length > 1 ? "s" : ""} · ${totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1)} hours total`}
            </p>
          </div>
          {isToday(selectedDate) && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-[#DCFCE7] text-[#166534]">
              Today
            </span>
          )}
          {isTomorrow(selectedDate) && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-[#DBEAFE] text-[#1E40AF]">
              Tomorrow
            </span>
          )}
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-[#1E293B] rounded-[14px] p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-[3px] rounded-full bg-[#E2E8F0] h-16" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-[#E2E8F0] rounded w-20" />
                    <div className="h-4 bg-[#E2E8F0] rounded w-32" />
                    <div className="h-3 bg-[#E2E8F0] rounded w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : dayLessons.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-[#F1F5F9] dark:bg-[#1E293B] flex items-center justify-center mb-4">
              <CalendarX className="h-8 w-8 text-[#94A3B8]" />
            </div>
            <p className="text-[15px] font-medium text-[#0F172A] dark:text-white">No lessons today</p>
            <p className="text-[13px] text-[#64748B] mt-1">Enjoy the day off</p>
            <button
              onClick={() => {
                setAddLessonDate(selectedDate);
                setAddLessonOpen(true);
              }}
              className="mt-4 text-[13px] font-medium text-[#2563EB]"
            >
              Add lesson
            </button>
          </div>
        ) : (
          /* Lesson cards */
          <div className="space-y-2.5">
            {dayLessons.map((lesson, idx) => {
              const config = lessonTypeConfig[lesson.lesson_type] || lessonTypeConfig.standard;
              const endTime = getEndTime(lesson.start_time, lesson.duration_minutes);
              const isConfirmed = lesson.status === "scheduled" || lesson.status === "confirmed";
              const isPending = lesson.status === "pending";

              // Check for gap before this card
              const gapBefore = gaps.find((g) => g.index === idx);

              return (
                <div key={lesson.id}>
                  {/* Gap insight strip */}
                  {gapBefore && (
                    <button
                      onClick={() => {
                        setAddLessonDate(selectedDate);
                        setAddLessonOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 bg-[#F1F5F9] dark:bg-[#1E293B] rounded-[10px] px-3 py-2.5 mb-2.5"
                    >
                      <div className="w-7 h-7 rounded-full bg-white dark:bg-[#334155] flex items-center justify-center flex-shrink-0">
                        <Info className="h-3.5 w-3.5 text-[#64748B]" />
                      </div>
                      <p className="text-[12px] text-[#334155] dark:text-[#94A3B8]">
                        {Math.floor(gapBefore.gapMinutes / 60)}-hour gap between lessons · room to add one
                      </p>
                    </button>
                  )}

                  {/* Lesson Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white dark:bg-[#1E293B] rounded-[14px] border border-[#E2E8F0] dark:border-[#334155] overflow-hidden"
                  >
                    <div className="flex">
                      {/* Accent bar */}
                      <div className="w-[3px] rounded-l-[14px]" style={{ backgroundColor: config.color }} />

                      <div className="flex-1 p-3.5">
                        {/* Tags row */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <span
                            className="text-[10px] font-medium px-[7px] py-[2px] rounded"
                            style={{ backgroundColor: config.tint, color: config.textColor }}
                          >
                            {config.label}
                          </span>
                          {isConfirmed && (
                            <span className="text-[10px] font-medium px-[7px] py-[2px] rounded bg-[#DCFCE7] text-[#166534]">
                              Confirmed
                            </span>
                          )}
                          {isPending && (
                            <span className="text-[10px] font-medium px-[7px] py-[2px] rounded bg-[#FEF3C7] text-[#92400E]">
                              Pending
                            </span>
                          )}
                        </div>

                        {/* Name + avatar */}
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[15px] font-medium text-[#0F172A] dark:text-white">
                            {lesson.pupil.name}
                          </p>
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: config.color }}
                          >
                            {lesson.pupil.profile_image_url ? (
                              <img src={lesson.pupil.profile_image_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              getInitials(lesson.pupil.name)
                            )}
                          </div>
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-[#64748B]" />
                            <span className="text-[12px] text-[#64748B]">
                              {formatTime(lesson.start_time)} – {endTime}
                            </span>
                          </div>
                          {lesson.pickup_location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-[#64748B]" />
                              <span className="text-[12px] text-[#64748B] truncate max-w-[120px]">
                                {lesson.pickup_location}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          {lesson.pupil.phone && (
                            <a
                              href={`tel:${lesson.pupil.phone}`}
                              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-[8px] bg-[#F1F5F9] dark:bg-[#334155] text-[12px] font-medium text-[#334155] dark:text-[#94A3B8] active:scale-[0.97] transition-transform"
                            >
                              <Phone className="h-3 w-3" />
                              Call
                            </a>
                          )}
                          <a
                            href={`sms:${lesson.pupil.phone || ""}`}
                            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-[8px] bg-[#F1F5F9] dark:bg-[#334155] text-[12px] font-medium text-[#334155] dark:text-[#94A3B8] active:scale-[0.97] transition-transform"
                          >
                            <MessageSquare className="h-3 w-3" />
                            Message
                          </a>
                          {lesson.pickup_location && (
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lesson.pickup_location)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-[8px] bg-[#F1F5F9] dark:bg-[#334155] text-[12px] font-medium text-[#334155] dark:text-[#94A3B8] active:scale-[0.97] transition-transform"
                            >
                              <Navigation className="h-3 w-3" />
                              Navigate
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ Bottom CTA ═══ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-[#F7F8FA] dark:from-[#0F172A] via-[#F7F8FA]/80 dark:via-[#0F172A]/80 to-transparent pt-8 pointer-events-none">
        <button
          onClick={() => {
            haptics.medium();
            setAddLessonDate(selectedDate);
            setAddLessonOpen(true);
          }}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[12px] text-[14px] font-medium shadow-lg shadow-[#2563EB]/25 active:scale-[0.98] transition-all pointer-events-auto"
        >
          <Plus className="h-4 w-4" />
          Add lesson
        </button>
      </div>

      {/* Add Lesson Sheet */}
      <AddLessonSheet
        open={addLessonOpen}
        onOpenChange={setAddLessonOpen}
        instructorId={instructorId}
        defaultDate={addLessonDate}
        onSuccess={() => {
          setAddLessonOpen(false);
          fetchData();
        }}
      />
    </div>
  );
}
