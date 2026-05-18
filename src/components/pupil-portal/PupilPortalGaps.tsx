// =============================================================================
// PupilPortalGaps.tsx — pupil-facing "Book a Lesson" screen (redesigned visual).
//
// Slot computation is delegated to the unified availability engine
// (`computeDaySlots` + `loadCourseAvailabilitySources` in
// `src/lib/courseAvailability.ts`) — the same engine used by the public
// booking page, /courses discovery, the auto-scheduler, the instructor
// gap-fill view, and the create-booking guard. This guarantees the pupil
// sees exactly what the instructor sees in their own diary.
//
// Busyness sources: Google Calendar mirror (`instructor_calendar_events`)
// + `instructor_manual_blocks` ONLY. `scheduled_lessons` is CRM data and is
// NEVER consulted for availability (see mem://constraints/google-calendar-source-of-truth).
//
// Visual layer follows the BookLessonScreen spec (Poppins-bound tokens,
// nav-free body because parent owns SubPageHeader).
// =============================================================================

import { useEffect, useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Check as CheckIcon,
  ChevronLeft as ChevronLeftIcon,
  SlidersHorizontal as SlidersIcon,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, parseISO, startOfDay } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { checkLessonClash, describeLessonClashError } from "@/lib/lessonClashCheck";
import {
  computeDaySlots,
  loadCourseAvailabilitySources,
  type InstructorLite,
  type CourseAvailabilitySources,
} from "@/lib/courseAvailability";
import { fromMinutes } from "@/lib/availabilityEngine";
import { geocodePostcode } from "@/lib/travelTime";

interface PupilPortalGapsProps {
  pupilId: string;
  instructorId: string;
  brandColour: string | null;
  darkMode: boolean;
}

interface DaySlot {
  id: string;
  date: string;
  startMin: number;
  endMin: number;
  startTime: string;
  endTime: string;
}

interface InstructorRow {
  id: string;
  name: string | null;
  available_from: string | null;
  buffer_minutes: number | null;
  slot_increment_minutes: number | null;
  is_network_placeholder: boolean | null;
  preferred_lesson_length: number | null;
  allowed_lesson_lengths: number[] | null;
}

// Design tokens (per spec — intentionally literal, not theme tokens).
const t = {
  navy: "#0F2044",
  blue: "#1A52A0",
  blueLight: "#E6F1FB",
  green: "#1D9E75",
  amber: "#F59E0B",
  amberLight: "#FEF3C7",
  amberText: "#92400E",
  charcoal: "#2B2B2B",
  mid: "#6B7280",
  muted: "#9CA3AF",
  surface: "#F2F4F8",
  white: "#FFFFFF",
  border: "#DDE3ED",
  grey: "#D1D5DB",
  greyChip: "#F3F4F6",
};

const POPPINS = "'Poppins', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";

const FALLBACK_DURATIONS = [60, 90, 120];

type FilterId = "week" | "morning" | "afternoon" | "2hrs" | "auto";
const FILTERS: { id: FilterId; label: string }[] = [
  { id: "week", label: "This week" },
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "2hrs", label: "2 hrs+" },
  { id: "auto", label: "Auto only" },
];

type DayGroup = {
  date: string;
  dayName: string;
  dateFormatted: string;
  hasSlots: boolean;
  isLimited: boolean;
  slots: DaySlot[];
};

const getAccentColour = (g: DayGroup): string => {
  if (!g.hasSlots) return t.grey;
  if (g.isLimited) return t.amber;
  return t.blue;
};

const formatTime = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "pm" : "am";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes}${ampm}`;
};

const durationLabel = (mins: number) =>
  mins % 60 === 0 ? `${mins / 60} hr${mins / 60 !== 1 ? "s" : ""}` : `${(mins / 60).toFixed(1)} hrs`;

export function PupilPortalGaps({ pupilId, instructorId }: PupilPortalGapsProps) {
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<string | null>(null);
  const [bookedIds, setBookedIds] = useState<Set<string>>(new Set());
  const [instructor, setInstructor] = useState<InstructorRow | null>(null);
  const [pupilPickup, setPupilPickup] = useState<{ lat: number; lng: number } | null>(null);
  const [pupilAddress, setPupilAddress] = useState<{ address: string; postcode: string }>({ address: "", postcode: "" });
  const [sources, setSources] = useState<CourseAvailabilitySources | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [slots, setSlots] = useState<DaySlot[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterId>("week");

  // Window start = max(today, instructor.available_from). We don't know this
  // until the instructor row loads, so the source fetch is sequential.
  const [startDate, setStartDate] = useState<Date>(() => startOfDay(new Date()));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [instrRes, pupilRes] = await Promise.all([
          supabase
            .from("instructors")
            .select(
              "id, name, available_from, buffer_minutes, slot_increment_minutes, is_network_placeholder, preferred_lesson_length, allowed_lesson_lengths",
            )
            .eq("id", instructorId)
            .maybeSingle(),
          supabase.from("pupils").select("address, postcode").eq("id", pupilId).maybeSingle(),
        ]);

        if (cancelled) return;

        const instrRow = (instrRes.data as unknown as InstructorRow | null) ?? null;
        setInstructor(instrRow);

        const defaultDur =
          instrRow?.preferred_lesson_length && instrRow.preferred_lesson_length > 0
            ? instrRow.preferred_lesson_length
            : 60;
        setDurationMinutes(defaultDur);

        const pAddr = (pupilRes.data?.address as string | null) ?? "";
        const pPc = (pupilRes.data?.postcode as string | null) ?? "";
        setPupilAddress({ address: pAddr, postcode: pPc });

        if (pPc) {
          geocodePostcode(pPc).then((coords) => {
            if (!cancelled) setPupilPickup(coords);
          });
        }

        // Start window at max(today, available_from), span 14 days.
        const today = startOfDay(new Date());
        const fromAv = instrRow?.available_from ? parseISO(instrRow.available_from) : today;
        const fromDate = fromAv > today ? startOfDay(fromAv) : today;
        const toDate = addDays(fromDate, 14);
        setStartDate(fromDate);

        const src = await loadCourseAvailabilitySources(supabase, [instructorId], fromDate, toDate);
        if (!cancelled) setSources(src);
      } catch (err) {
        console.error("Error loading availability sources:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [instructorId, pupilId]);

  useEffect(() => {
    if (!instructor || !sources) {
      setSlots([]);
      return;
    }
    const instructorLite: InstructorLite = {
      id: instructor.id,
      available_from: instructor.available_from,
      buffer_minutes: instructor.buffer_minutes ?? 0,
      is_network_placeholder: instructor.is_network_placeholder ?? false,
    };
    const fromDate = startDate;
    const slotIncrement = instructor.slot_increment_minutes ?? 60;
    const buffer = instructor.buffer_minutes ?? 0;
    const out: DaySlot[] = [];
    for (let i = 0; i <= 14; i++) {
      const day = addDays(fromDate, i);
      const dateStr = format(day, "yyyy-MM-dd");
      const { slots: daySlots } = computeDaySlots(instructorLite, day, sources, {
        durationMinutes,
        bufferMinutes: buffer,
        slotIncrementMinutes: slotIncrement,
        candidatePickup: pupilPickup ?? undefined,
      });
      for (const s of daySlots) {
        const startTime = fromMinutes(s.start);
        out.push({
          id: `${dateStr}-${startTime}`,
          date: dateStr,
          startMin: s.start,
          endMin: s.end,
          startTime,
          endTime: fromMinutes(s.end),
        });
      }
    }
    setSlots(out);
  }, [instructor, sources, durationMinutes, pupilPickup, startDate]);

  const handleBookSlot = async (slot: DaySlot) => {
    if (bookedIds.has(slot.id)) return;
    setBooking(slot.id);
    try {
      const clash = await checkLessonClash({
        instructorId,
        date: slot.date,
        startTime: slot.startTime,
        durationMinutes,
      });
      if (clash.hardOverlap) {
        toast({
          title: "Slot just got booked",
          description: clash.message ?? "That slot is already booked. Please pick another time.",
          variant: "destructive",
        });
        setSlots((prev) => prev.filter((s) => s.id !== slot.id));
        return;
      }
      const { error } = await supabase.from("scheduled_lessons").insert({
        instructor_id: instructorId,
        pupil_id: pupilId,
        lesson_date: slot.date,
        start_time: slot.startTime,
        duration_minutes: durationMinutes,
        pickup_location: pupilAddress.address || "",
        pickup_postcode: pupilAddress.postcode || "",
        lesson_type: "Standard Lesson",
        status: "confirmed",
        payment_status: "not_paid",
      });
      if (error) {
        const friendly = describeLessonClashError(error);
        if (friendly) {
          toast({ title: "Slot just got booked", description: friendly, variant: "destructive" });
          return;
        }
        throw error;
      }
      toast({ title: "Lesson booked!", description: "Your instructor will confirm shortly" });
      setBookedIds((prev) => new Set(prev).add(slot.id));
    } catch (err) {
      console.error("Error booking slot:", err);
      toast({ title: "Error", description: "Failed to book lesson", variant: "destructive" });
    } finally {
      setBooking(null);
    }
  };

  // Duration chips
  const durationOptions =
    instructor?.allowed_lesson_lengths && instructor.allowed_lesson_lengths.length > 0
      ? [...instructor.allowed_lesson_lengths].sort((a, b) => a - b)
      : FALLBACK_DURATIONS;

  // Apply client-side filter to the engine-produced slots.
  const filteredSlots = useMemo(() => {
    return slots.filter((s) => {
      const hour = Math.floor(s.startMin / 60);
      if (activeFilter === "morning") return hour < 12;
      if (activeFilter === "afternoon") return hour >= 12;
      if (activeFilter === "2hrs") return s.endMin - s.startMin >= 120;
      // "week" and "auto" — show everything (auto is informational; we have no transmission data)
      return true;
    });
  }, [slots, activeFilter]);

  // Build day groups for the next 14 days (always include empty days).
  const groups: DayGroup[] = useMemo(() => {
    const fromDate = startDate;
    const byDate = new Map<string, DaySlot[]>();
    for (const s of filteredSlots) {
      if (!byDate.has(s.date)) byDate.set(s.date, []);
      byDate.get(s.date)!.push(s);
    }
    const out: DayGroup[] = [];
    for (let i = 0; i < 14; i++) {
      const day = addDays(fromDate, i);
      const dateStr = format(day, "yyyy-MM-dd");
      const daySlots = byDate.get(dateStr) ?? [];
      out.push({
        date: dateStr,
        dayName: format(day, "EEEE"),
        dateFormatted: format(day, "d MMM yyyy"),
        hasSlots: daySlots.length > 0,
        isLimited: daySlots.length === 1,
        slots: daySlots,
      });
    }
    return out;
  }, [filteredSlots, startDate]);

  const instructorName = instructor?.name ?? "your instructor";

  if (loading) {
    return (
      <div className="flex-1" style={{ backgroundColor: t.surface, fontFamily: POPPINS }}>
        <div className="flex justify-center pt-10">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: t.blue }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: t.surface, fontFamily: POPPINS }} className="min-h-full">
      {/* Header */}
      <div
        style={{
          backgroundColor: t.white,
          borderBottom: `1px solid ${t.border}`,
          padding: "20px 20px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <div style={{ width: 14, height: 2, backgroundColor: t.blue, borderRadius: 1 }} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: t.blue,
              letterSpacing: 0.7,
              textTransform: "uppercase",
            }}
          >
            Available slots
          </span>
        </div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: t.navy,
            letterSpacing: -0.4,
            marginBottom: 4,
            lineHeight: 1.2,
          }}
        >
          Pick your slot
        </h1>
        <p style={{ fontSize: 13, fontWeight: 300, color: t.muted, lineHeight: "20px", margin: 0 }}>
          Lessons with{" "}
          <span style={{ fontWeight: 500, color: t.mid }}>{instructorName}</span>
          {" · "}
          {durationLabel(durationMinutes)}
        </p>
      </div>

      {/* Future-availability notice */}
      {instructor?.available_from &&
        startDate.getTime() > startOfDay(new Date()).getTime() && (
          <div
            style={{
              backgroundColor: t.amberLight,
              borderBottom: `1px solid ${t.border}`,
              padding: "10px 16px",
            }}
          >
            <p style={{ fontSize: 12, fontWeight: 500, color: t.amberText, margin: 0 }}>
              {instructorName} starts taking bookings on{" "}
              {format(parseISO(instructor.available_from), "EEEE d MMMM yyyy")}.
              Showing the first 14 days from then.
            </p>
          </div>
        )}

      {/* Duration chips */}
      <div
        style={{
          backgroundColor: t.white,
          borderBottom: `1px solid ${t.border}`,
          padding: "10px 16px",
          display: "flex",
          gap: 6,
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {durationOptions.map((d) => {
          const active = d === durationMinutes;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDurationMinutes(d)}
              style={{
                border: `1px solid ${active ? t.navy : t.border}`,
                borderRadius: 20,
                padding: "5px 12px",
                backgroundColor: active ? t.navy : t.white,
                color: active ? t.white : t.mid,
                fontSize: 11,
                fontWeight: 500,
                whiteSpace: "nowrap",
                fontFamily: POPPINS,
                cursor: "pointer",
              }}
            >
              {d % 60 === 0 ? `${d / 60} hr${d / 60 !== 1 ? "s" : ""}` : `${d} min`}
            </button>
          );
        })}
      </div>

      {/* Filter strip */}
      <div
        style={{
          backgroundColor: t.white,
          borderBottom: `1px solid ${t.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 6,
            padding: "12px 16px",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {FILTERS.map((f) => {
            const active = activeFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                style={{
                  border: `1px solid ${active ? t.navy : t.border}`,
                  borderRadius: 20,
                  padding: "5px 12px",
                  backgroundColor: active ? t.navy : t.white,
                  color: active ? t.white : t.mid,
                  fontSize: 11,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  fontFamily: POPPINS,
                  cursor: "pointer",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day list */}
      <div style={{ padding: 16, paddingBottom: 40 }}>
        {groups.map((group) => {
          const accent = getAccentColour(group);
          return (
            <div key={group.date} style={{ marginBottom: 14 }}>
              {/* Day header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                  padding: "0 2px",
                }}
              >
                <CalendarIcon
                  size={14}
                  color={group.hasSlots ? t.blue : t.muted}
                  strokeWidth={1.8}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: group.hasSlots ? t.navy : t.muted,
                      lineHeight: 1.2,
                    }}
                  >
                    {group.dayName}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 400, color: t.muted, marginTop: 1 }}>
                    {group.dateFormatted}
                  </div>
                </div>
                {group.hasSlots ? (
                  <div
                    style={{
                      backgroundColor: group.isLimited ? t.amberLight : t.blueLight,
                      borderRadius: 20,
                      padding: "2px 9px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: group.isLimited ? t.amberText : t.blue,
                      }}
                    >
                      {group.isLimited
                        ? `${group.slots.length} slot · filling`
                        : `${group.slots.length} slot${group.slots.length !== 1 ? "s" : ""}`}
                    </span>
                  </div>
                ) : (
                  <div style={{ backgroundColor: t.greyChip, borderRadius: 20, padding: "2px 9px" }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: t.muted }}>No slots</span>
                  </div>
                )}
              </div>

              {/* Day card */}
              <div
                style={{
                  backgroundColor: t.white,
                  borderRadius: 14,
                  border: `1px solid ${t.border}`,
                  overflow: "hidden",
                  opacity: group.hasSlots ? 1 : 0.6,
                  boxShadow: "0 1px 6px rgba(15,32,68,0.05)",
                }}
              >
                <div style={{ height: 3, backgroundColor: accent }} />

                {group.hasSlots ? (
                  group.slots.map((slot, i) => {
                    const isLast = i === group.slots.length - 1;
                    const isBooking = booking === slot.id;
                    const isBooked = bookedIds.has(slot.id);
                    return (
                      <div
                        key={slot.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: 14,
                          borderBottom: isLast ? "none" : `1px solid ${t.surface}`,
                        }}
                      >
                        <ClockIcon size={14} color={t.muted} strokeWidth={1.8} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: t.navy,
                              letterSpacing: -0.2,
                              marginBottom: 2,
                            }}
                          >
                            {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <div
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: group.isLimited ? t.amber : t.green,
                              }}
                            />
                            <span style={{ fontSize: 11, fontWeight: 400, color: t.muted }}>
                              {group.isLimited ? "Only 1 slot left" : "Available"}
                            </span>
                          </div>
                        </div>
                        <div
                          style={{
                            backgroundColor: t.surface,
                            borderRadius: 6,
                            padding: "2px 8px",
                            flexShrink: 0,
                          }}
                        >
                          <span style={{ fontSize: 11, fontWeight: 500, color: t.mid }}>
                            {durationLabel(durationMinutes)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleBookSlot(slot)}
                          disabled={isBooking || isBooked}
                          style={{
                            backgroundColor: isBooked ? t.green : t.blue,
                            borderRadius: 9,
                            padding: "9px 16px",
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            flexShrink: 0,
                            border: "none",
                            cursor: isBooking || isBooked ? "default" : "pointer",
                            fontFamily: POPPINS,
                            minHeight: 36,
                          }}
                        >
                          {isBooking ? (
                            <Loader2 size={12} color={t.white} className="animate-spin" />
                          ) : (
                            <CheckIcon size={11} color={t.white} strokeWidth={2.5} />
                          )}
                          <span style={{ fontSize: 13, fontWeight: 600, color: t.white }}>
                            {isBooked ? "Booked" : "Book"}
                          </span>
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: 16, textAlign: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 300, color: t.muted }}>
                      No availability on this day
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
