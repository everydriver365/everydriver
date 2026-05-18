// =============================================================================
// PupilPortalGaps.tsx — pupil-facing "Book a Lesson" screen.
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
// =============================================================================

import { useEffect, useState } from "react";
import { Calendar, Clock, Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

interface PupilPortalGapsProps {
  pupilId: string;
  instructorId: string;
  brandColour: string | null;
  darkMode: boolean;
}

interface DaySlot {
  date: string;
  startMin: number;
  endMin: number;
  startTime: string;
  endTime: string;
}

interface InstructorRow {
  id: string;
  available_from: string | null;
  buffer_minutes: number | null;
  slot_increment_minutes: number | null;
  is_network_placeholder: boolean | null;
  preferred_lesson_length: number | null;
  allowed_lesson_lengths: number[] | null;
}

const FALLBACK_DURATIONS = [60, 90, 120];

export function PupilPortalGaps({
  pupilId,
  instructorId,
  brandColour,
}: PupilPortalGapsProps) {
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<string | null>(null);
  const [instructor, setInstructor] = useState<InstructorRow | null>(null);
  const [pupilPickup, setPupilPickup] = useState<{ lat: number; lng: number } | null>(null);
  const [pupilAddress, setPupilAddress] = useState<{ address: string; postcode: string }>({ address: "", postcode: "" });
  const [sources, setSources] = useState<CourseAvailabilitySources | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [slots, setSlots] = useState<DaySlot[]>([]);

  // Load instructor settings + pupil pickup + availability sources once.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const fromDate = startOfDay(new Date());
        const toDate = addDays(fromDate, 14);

        const [instrRes, pupilRes, src] = await Promise.all([
          supabase
            .from("instructors")
            .select(
              "id, available_from, buffer_minutes, slot_increment_minutes, is_network_placeholder, preferred_lesson_length, allowed_lesson_lengths",
            )
            .eq("id", instructorId)
            .maybeSingle(),
          supabase
            .from("pupils")
            .select("address, postcode")
            .eq("id", pupilId)
            .maybeSingle(),
          loadCourseAvailabilitySources(supabase, [instructorId], fromDate, toDate),
        ]);

        if (cancelled) return;

        const instrRow = (instrRes.data as InstructorRow | null) ?? null;
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
          const coords = await geocodePostcode(pPc);
          if (!cancelled) setPupilPickup(coords);
        }

        setSources(src);
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

  // Recompute slots whenever instructor/sources/duration/pickup change.
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

    const fromDate = startOfDay(new Date());
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
        out.push({
          date: dateStr,
          startMin: s.start,
          endMin: s.end,
          startTime: fromMinutes(s.start),
          endTime: fromMinutes(s.end),
        });
      }
    }

    setSlots(out);
  }, [instructor, sources, durationMinutes, pupilPickup]);

  const handleBookSlot = async (slot: DaySlot) => {
    const slotKey = `${slot.date}-${slot.startTime}`;
    setBooking(slotKey);

    try {
      // Pre-check for a clash before inserting (race-condition guard).
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
        setSlots((prev) => prev.filter((s) => !(s.date === slot.date && s.startTime === slot.startTime)));
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
      // Optimistic: drop the slot. The `sync-lesson-now` trigger will mirror
      // the booking into `instructor_calendar_events` so future loads hide it.
      setSlots((prev) => prev.filter((s) => !(s.date === slot.date && s.startTime === slot.startTime)));
    } catch (err) {
      console.error("Error booking slot:", err);
      toast({ title: "Error", description: "Failed to book lesson", variant: "destructive" });
    } finally {
      setBooking(null);
    }
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "pm" : "am";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes}${ampm}`;
  };

  // Duration chips: prefer instructor.allowed_lesson_lengths, fallback to common set.
  const durationOptions =
    instructor?.allowed_lesson_lengths && instructor.allowed_lesson_lengths.length > 0
      ? [...instructor.allowed_lesson_lengths].sort((a, b) => a - b)
      : FALLBACK_DURATIONS;

  if (loading) {
    return (
      <div className="px-4">
        <Card style={{ backgroundColor: "var(--brand-card)", borderColor: "var(--brand-border)" }}>
          <CardContent className="p-6 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--brand-muted)" }} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, DaySlot[]>);

  return (
    <div className="px-4 space-y-4">
      <div>
        <h2 className="text-lg font-bold" style={{ color: "var(--brand-text)" }}>
          Book a Lesson
        </h2>
        <p className="text-sm" style={{ color: "var(--brand-muted)" }}>
          Choose a lesson length, then pick a time that suits you.
        </p>
      </div>

      {/* Duration chips */}
      <div className="flex flex-wrap gap-2">
        {durationOptions.map((d) => {
          const active = d === durationMinutes;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDurationMinutes(d)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                "min-h-[36px]",
              )}
              style={{
                backgroundColor: active ? brandColour || "#1e3a5f" : "transparent",
                color: active ? "#ffffff" : "var(--brand-text)",
                borderColor: active ? brandColour || "#1e3a5f" : "var(--brand-border)",
              }}
            >
              {d % 60 === 0 ? `${d / 60}h` : `${d}m`}
            </button>
          );
        })}
      </div>

      {Object.keys(slotsByDate).length === 0 ? (
        <Card style={{ backgroundColor: "var(--brand-card)", borderColor: "var(--brand-border)" }}>
          <CardContent className="p-6 text-center">
            <Calendar className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--brand-muted)" }} />
            <p className="font-medium" style={{ color: "var(--brand-text)" }}>
              No availability in the next 14 days
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--brand-muted)" }}>
              Try a different lesson length, or contact your instructor.
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(slotsByDate).map(([date, daySlots]) => (
          <Card
            key={date}
            style={{ backgroundColor: "var(--brand-card)", borderColor: "var(--brand-border)" }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2" style={{ color: "var(--brand-text)" }}>
                <Calendar className="h-4 w-4" style={{ color: brandColour || "#1e3a5f" }} />
                {format(parseISO(date), "EEEE, d MMMM")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {daySlots.map((slot) => {
                  const slotKey = `${slot.date}-${slot.startTime}`;
                  const isBooking = booking === slotKey;

                  return (
                    <div
                      key={slotKey}
                      className="flex items-center justify-between rounded-lg border p-3"
                      style={{ borderColor: "var(--brand-border)" }}
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4" style={{ color: "var(--brand-muted)" }} />
                        <div>
                          <div className="font-medium" style={{ color: "var(--brand-text)" }}>
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </div>
                          <div className="text-xs" style={{ color: "var(--brand-muted)" }}>
                            {durationMinutes % 60 === 0
                              ? `${durationMinutes / 60}h lesson`
                              : `${durationMinutes}m lesson`}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        disabled={isBooking}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleBookSlot(slot);
                        }}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                          if (!isBooking) handleBookSlot(slot);
                        }}
                        className="min-h-[44px] touch-manipulation active:scale-95 transition-transform"
                        style={{ backgroundColor: brandColour || "#1e3a5f", color: "#ffffff" }}
                      >
                        {isBooking ? (
                          <Loader2 className="h-4 w-4 animate-spin pointer-events-none" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1 pointer-events-none" />
                            Book
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
