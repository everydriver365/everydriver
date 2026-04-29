import { useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, parse, differenceInCalendarDays } from "date-fns";
import { toast } from "sonner";
import { UserAvatar } from "@/components/instructor/UserAvatar";
import { titleCaseName } from "@/lib/titleCase";

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

const C = {
  bg: "#FFFFFF",
  surface: "#F8FAFB",
  hairline: "#E5E5EA",
  text: "#000000",
  muted: "#6E6E73",
  link: "#2B7BC8",
  linkTint: "#E6F1FB",
  green: "#3B8B3B",
  amber: "#B8801F",
  amberTint: "#FBF1DE",
};

interface StepBookNextProps {
  pupilId: string;
  pupilName: string;
  instructorId: string;
  durationMinutes: number;
  /** Today's lesson start time (HH:mm:ss) — used as the "same time" pattern anchor. */
  todayStartTime?: string;
  onBooked: () => void;
  onSkip: () => void;
}

type SlotCategory = "best" | "pattern" | "gap" | "preference" | "urgency";

interface SuggestedSlot {
  date: string;
  startTime: string;
  category: SlotCategory;
  reasoning: string;
}

function needsNameReview(name: string): boolean {
  if (!name) return false;
  const t = name.trim();
  if (!t) return false;
  if (/^(unknown|n\/a|none)$/i.test(t)) return true;
  if (/[<>{}\\]/.test(t)) return true;
  return false;
}

interface PupilContext {
  homePostcode: string | null;
  homeAddress: string | null;
  testDate: string | null;
  courseName: string | null;
  courseHoursTotal: number | null;
  courseHoursRemaining: number | null;
}

export function StepBookNext({
  pupilId,
  pupilName,
  instructorId,
  durationMinutes,
  todayStartTime,
  onBooked,
  onSkip,
}: StepBookNextProps) {
  const [slots, setSlots] = useState<SuggestedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [pupilCtx, setPupilCtx] = useState<PupilContext>({
    homePostcode: null,
    homeAddress: null,
    testDate: null,
    courseName: null,
    courseHoursTotal: null,
    courseHoursRemaining: null,
  });

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    try {
      // Pupil context
      const { data: pupil } = await supabase
        .from("pupils")
        .select("postcode, address, test_date")
        .eq("id", pupilId)
        .maybeSingle();

      // Course / package context (best-effort; tolerate missing tables)
      let courseName: string | null = null;
      let courseHoursTotal: number | null = null;
      let courseHoursRemaining: number | null = null;
      try {
        const { data: pkg } = await (supabase as any)
          .from("pupil_packages")
          .select("name, total_hours, remaining_hours")
          .eq("pupil_id", pupilId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (pkg) {
          courseName = pkg.name ?? null;
          courseHoursTotal = pkg.total_hours ?? null;
          courseHoursRemaining = pkg.remaining_hours ?? null;
        }
      } catch {
        /* table optional */
      }

      setPupilCtx({
        homePostcode: (pupil as any)?.postcode ?? null,
        homeAddress: (pupil as any)?.address ?? null,
        testDate: (pupil as any)?.test_date ?? null,
        courseName,
        courseHoursTotal,
        courseHoursRemaining,
      });

      // Instructor preferences + buffer + home_postcode
      const { data: instructorData } = await supabase
        .from("instructors")
        .select("prefer_earliest_slot, buffer_minutes, home_postcode")
        .eq("id", instructorId)
        .maybeSingle();
      const preferEarliest = (instructorData as any)?.prefer_earliest_slot ?? false;
      const bufferMinutes = (instructorData as any)?.buffer_minutes ?? 0;
      const homePostcode = (instructorData as any)?.home_postcode;
      const pupilPostcode = (pupil as any)?.postcode;

      // Travel time for first-of-day buffer
      let travelMinutes = 0;
      if (homePostcode && pupilPostcode) {
        try {
          const { data: travelData } = await supabase.functions.invoke("check-travel-buffer", {
            body: { from_postcode: homePostcode, to_postcode: pupilPostcode },
          });
          if (travelData?.travel_minutes != null) travelMinutes = travelData.travel_minutes;
        } catch {
          /* fallback */
        }
      }
      const effectiveFirstSlotBuffer = Math.max(travelMinutes, bufferMinutes);

      // Pupil's previously-booked patterns (for preference scoring)
      const { data: pastLessons } = await supabase
        .from("scheduled_lessons")
        .select("lesson_date, start_time")
        .eq("pupil_id", pupilId)
        .eq("instructor_id", instructorId)
        .neq("status", "cancelled")
        .order("lesson_date", { ascending: false })
        .limit(20);

      const dowCount: Record<number, number> = {};
      const todCount: Record<string, number> = {};
      (pastLessons || []).forEach((l) => {
        const d = parse(l.lesson_date as string, "yyyy-MM-dd", new Date());
        dowCount[d.getDay()] = (dowCount[d.getDay()] || 0) + 1;
        const hour = parseInt((l.start_time as string).slice(0, 2), 10);
        const tod = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
        todCount[tod] = (todCount[tod] || 0) + 1;
      });
      const preferredDow = Object.entries(dowCount).sort((a, b) => b[1] - a[1])[0]?.[0];
      const preferredTod = Object.entries(todCount).sort((a, b) => b[1] - a[1])[0]?.[0] as
        | "morning"
        | "afternoon"
        | "evening"
        | undefined;

      // Look at next 7 days for available slots
      const today = new Date();
      const todayStr = format(today, "yyyy-MM-dd");
      const weekLaterStr = format(addDays(today, 7), "yyyy-MM-dd");

      const { data: calendarEvents } = await supabase
        .from("instructor_calendar_events")
        .select("start_time, end_time")
        .eq("instructor_id", instructorId)
        .eq("is_busy", true)
        .gte("end_time", `${todayStr}T00:00:00`)
        .lte("start_time", `${weekLaterStr}T23:59:59`);

      const bufferMs = bufferMinutes * 60000;

      interface Candidate {
        date: string;
        startTime: string;
        score: number;
        category: SlotCategory;
        reasoning: string;
      }
      const candidates: Candidate[] = [];

      const anchorTime = todayStartTime ?? null; // for "same time" pattern

      for (let d = 1; d <= 7; d++) {
        const date = addDays(today, d);
        const dateStr = format(date, "yyyy-MM-dd");

        const { data: existing } = await supabase
          .from("scheduled_lessons")
          .select("start_time, duration_minutes")
          .eq("instructor_id", instructorId)
          .eq("lesson_date", dateStr)
          .neq("status", "cancelled")
          .order("start_time");

        const dayCalBusy = (calendarEvents || [])
          .map((ev) => ({ start: new Date(ev.start_time), end: new Date(ev.end_time) }))
          .filter((ev) => {
            if (ev.end.getTime() - ev.start.getTime() >= 24 * 60 * 60 * 1000) return false;
            return format(ev.start, "yyyy-MM-dd") === dateStr;
          });

        const hasExistingOnDay = (existing || []).length > 0 || dayCalBusy.length > 0;

        const candidateTimes = preferEarliest
          ? ["09:00:00", "09:30:00", "10:00:00", "10:30:00", "11:00:00", "13:00:00", "15:00:00"]
          : ["09:00:00", "11:00:00", "13:00:00", "15:00:00"];

        // Always consider the anchor time too, so "same time" pattern works
        if (anchorTime && !candidateTimes.includes(anchorTime)) {
          candidateTimes.push(anchorTime);
        }

        for (const ct of candidateTimes) {
          const candidateStart = parse(ct, "HH:mm:ss", date).getTime();
          const candidateEnd = candidateStart + durationMinutes * 60000;

          const isFirstOfDay =
            !hasExistingOnDay ||
            ((existing || []).every(
              (ex) => parse(ex.start_time as string, "HH:mm:ss", date).getTime() >= candidateStart,
            ) &&
              dayCalBusy.every((ev) => ev.start.getTime() >= candidateStart));
          if (isFirstOfDay && effectiveFirstSlotBuffer > bufferMinutes) {
            const dayStart = parse("09:00:00", "HH:mm:ss", date).getTime();
            const earliestAllowed = dayStart + effectiveFirstSlotBuffer * 60000;
            if (candidateStart < earliestAllowed) continue;
          }

          const lessonConflict = (existing || []).some((ex) => {
            const exStart = parse(ex.start_time as string, "HH:mm:ss", date).getTime();
            const exEnd = exStart + ((ex.duration_minutes as number) || 60) * 60000;
            return candidateStart < exEnd + bufferMs && candidateEnd > exStart - bufferMs;
          });
          const calConflict = dayCalBusy.some(
            (ev) =>
              candidateStart < ev.end.getTime() + bufferMs &&
              candidateEnd > ev.start.getTime() - bufferMs,
          );
          if (lessonConflict || calConflict) continue;

          // --- score & categorise ---
          let score = 0;
          let category: SlotCategory = "pattern";
          let reasoning = "Same time as last lesson";

          if (anchorTime && ct === anchorTime) {
            score += 30;
            category = "pattern";
            reasoning = d === 7 ? "Same time next week" : "Same time as today";
          }
          if (preferredDow && date.getDay() === parseInt(preferredDow, 10)) {
            score += 20;
            category = "preference";
            reasoning = `Pupil's usual ${format(date, "EEEE")} slot`;
          }
          const hour = parseInt(ct.slice(0, 2), 10);
          const tod = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
          if (preferredTod && preferredTod === tod) {
            score += 10;
            if (category !== "preference") {
              reasoning = `Pupil's preferred ${tod}`;
              category = "preference";
            }
          }
          // Gap fill: if this slot is sandwiched between existing lessons that day
          if ((existing || []).length >= 1) {
            const before = (existing || []).find((ex) => {
              const exStart = parse(ex.start_time as string, "HH:mm:ss", date).getTime();
              const exEnd = exStart + ((ex.duration_minutes as number) || 60) * 60000;
              return exEnd <= candidateStart;
            });
            const after = (existing || []).find((ex) => {
              const exStart = parse(ex.start_time as string, "HH:mm:ss", date).getTime();
              return exStart >= candidateEnd;
            });
            if (before && after) {
              score += 25;
              category = "gap";
              reasoning = "Fills a gap in your schedule";
            }
          }
          // Test-prep urgency
          if (pupil && (pupil as any).test_date) {
            const testDate = parse((pupil as any).test_date, "yyyy-MM-dd", new Date());
            const daysToTest = differenceInCalendarDays(testDate, date);
            if (daysToTest >= 0 && daysToTest <= 21) {
              score += 15;
              category = "urgency";
              reasoning = `Test in ${daysToTest} days · keeps pace`;
            }
          }
          // Earliest preference bonus
          if (preferEarliest) score += Math.max(0, 12 - hour);

          // Sooner-is-better tiebreaker
          score += Math.max(0, 8 - d);

          candidates.push({ date: dateStr, startTime: ct, score, category, reasoning });
        }
      }

      // Pick best 3, deduped by (date, time), avoiding duplicate categories on top picks.
      candidates.sort((a, b) => b.score - a.score);
      const seen = new Set<string>();
      const top: Candidate[] = [];
      for (const c of candidates) {
        const key = `${c.date}|${c.startTime}`;
        if (seen.has(key)) continue;
        seen.add(key);
        top.push(c);
        if (top.length === 3) break;
      }

      const out: SuggestedSlot[] = top.map((t, i) => ({
        date: t.date,
        startTime: t.startTime,
        category: i === 0 ? "best" : t.category,
        reasoning: t.reasoning,
      }));

      setSlots(out);
      // Pre-select the best match for tap-to-confirm flow
      if (out.length > 0) setSelectedIdx(0);
    } catch (e) {
      console.error("Error finding slots:", e);
    } finally {
      setLoading(false);
    }
  };

  const displayName = useMemo(() => titleCaseName(pupilName) || pupilName, [pupilName]);
  const showReview = needsNameReview(pupilName);

  const subtitle = useMemo(() => {
    const { courseName, courseHoursTotal, courseHoursRemaining, testDate } = pupilCtx;
    if (
      courseName &&
      typeof courseHoursTotal === "number" &&
      typeof courseHoursRemaining === "number"
    ) {
      return `${courseName} · ${courseHoursRemaining}h of ${courseHoursTotal}h remaining`;
    }
    if (testDate) {
      try {
        const td = parse(testDate, "yyyy-MM-dd", new Date());
        return `Test prep · test on ${format(td, "d MMM")}`;
      } catch {
        /* ignore */
      }
    }
    return "Standard lesson";
  }, [pupilCtx]);

  const formatDurationLabel = (mins: number): string => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const handleBook = async () => {
    if (selectedIdx == null) return;
    const slot = slots[selectedIdx];
    if (!slot) return;
    setBooking(true);
    try {
      const { error } = await supabase.from("scheduled_lessons").insert({
        instructor_id: instructorId,
        pupil_id: pupilId,
        lesson_date: slot.date,
        start_time: slot.startTime,
        duration_minutes: durationMinutes,
        status: "scheduled",
        lesson_type: "Standard",
      });
      if (error) throw error;
      const dt = parse(slot.date, "yyyy-MM-dd", new Date());
      toast.success(
        `Lesson booked · ${format(dt, "d MMM")} ${format(parse(slot.startTime, "HH:mm:ss", dt), "HH:mm")}`,
      );
      onBooked();
    } catch (e) {
      console.error(e);
      toast.error("Failed to book lesson");
    } finally {
      setBooking(false);
    }
  };

  const reasoningColor = (cat: SlotCategory): { color: string; weight: 400 | 500 } => {
    switch (cat) {
      case "gap":
        return { color: C.green, weight: 500 };
      case "urgency":
        return { color: C.amber, weight: 500 };
      case "best":
      case "pattern":
      case "preference":
      default:
        return { color: C.muted, weight: 400 };
    }
  };

  // Pickup row content (only show if we have an address)
  const pickupAddress = pupilCtx.homeAddress
    ? pupilCtx.homePostcode
      ? `${pupilCtx.homeAddress}, ${pupilCtx.homePostcode}`
      : pupilCtx.homeAddress
    : pupilCtx.homePostcode || null;

  return (
    <div style={{ fontFamily: FONT_STACK, color: C.text, background: C.bg }}>
      {/* Pupil identity bar with course context */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: `0.5px solid ${C.hairline}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "-8px -24px 0",
        }}
      >
        <UserAvatar name={displayName} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 1 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: C.text,
                letterSpacing: -0.1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {displayName}
            </span>
            {showReview && (
              <span
                style={{
                  background: C.amberTint,
                  color: C.amber,
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: 0.3,
                  padding: "2px 5px",
                  borderRadius: 3,
                  textTransform: "uppercase",
                  flexShrink: 0,
                }}
              >
                Review
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 11,
              color: C.muted,
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 16, margin: "0 -24px" }}>
        {/* Suggested slots header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: C.muted,
              letterSpacing: 0.3,
              textTransform: "uppercase",
            }}
          >
            Suggested slots
          </span>
          <button
            type="button"
            onClick={() => {
              // Preserve existing date/time picker access. If none is wired here,
              // skip-as-pick lets the instructor reach the calendar to choose freely.
              toast.message("Open the calendar to pick another time");
            }}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              fontSize: 11,
              fontWeight: 500,
              color: C.link,
              cursor: "pointer",
            }}
          >
            Pick another time
          </button>
        </div>

        {loading ? (
          <div
            style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          >
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: C.muted }} />
          </div>
        ) : slots.length === 0 ? (
          <div
            style={{
              padding: 16,
              textAlign: "center",
              fontSize: 13,
              color: C.muted,
              border: `0.5px dashed ${C.hairline}`,
              borderRadius: 10,
            }}
          >
            No available slots in the next 7 days. Use “Pick another time” to choose freely.
          </div>
        ) : (
          slots.map((slot, idx) => {
            const dt = parse(slot.date, "yyyy-MM-dd", new Date());
            const isSelected = selectedIdx === idx;
            const isBest = slot.category === "best";
            const showBlueBorder = isSelected || isBest;
            const r = reasoningColor(slot.category);
            const startDisplay = format(parse(slot.startTime, "HH:mm:ss", dt), "HH:mm");

            return (
              <div
                key={`${slot.date}-${slot.startTime}`}
                style={{
                  position: "relative",
                  marginBottom: idx === slots.length - 1 ? 0 : 8,
                }}
              >
                {isBest && (
                  <span
                    style={{
                      position: "absolute",
                      top: -7,
                      left: 12,
                      background: C.linkTint,
                      color: C.link,
                      borderRadius: 999,
                      padding: "2px 8px",
                      fontSize: 9,
                      fontWeight: 500,
                      letterSpacing: 0.3,
                      textTransform: "uppercase",
                      zIndex: 1,
                    }}
                  >
                    Best match
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  disabled={booking}
                  style={{
                    width: "100%",
                    background: C.bg,
                    border: `0.5px solid ${showBlueBorder ? C.link : C.hairline}`,
                    borderRadius: 10,
                    padding: 12,
                    cursor: booking ? "default" : "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  {/* Date stack */}
                  <div style={{ flexShrink: 0, minWidth: 38 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: C.muted,
                        letterSpacing: 0.3,
                        textTransform: "uppercase",
                        lineHeight: 1.1,
                        margin: 0,
                      }}
                    >
                      {format(dt, "EEE")}
                    </div>
                    <div
                      style={{
                        fontSize: 19,
                        fontWeight: 500,
                        color: C.text,
                        letterSpacing: -0.4,
                        lineHeight: 1,
                        margin: 0,
                      }}
                    >
                      {format(dt, "d")}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: C.muted,
                        lineHeight: 1.1,
                        margin: "1px 0 0",
                      }}
                    >
                      {format(dt, "MMM")}
                    </div>
                  </div>

                  {/* Hairline divider */}
                  <div
                    style={{
                      width: 0.5,
                      alignSelf: "stretch",
                      background: C.hairline,
                      flexShrink: 0,
                    }}
                  />

                  {/* Slot details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: C.text,
                        letterSpacing: -0.1,
                        margin: "0 0 1px",
                      }}
                    >
                      {startDisplay} · {formatDurationLabel(durationMinutes)}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: r.color,
                        fontWeight: r.weight,
                        margin: 0,
                      }}
                    >
                      {slot.reasoning}
                    </div>
                  </div>

                  {/* Trailing chevron */}
                  <svg
                    width={12}
                    height={12}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={showBlueBorder ? C.link : C.muted}
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0 }}
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            );
          })
        )}

        {/* Pickup location reminder */}
        {pickupAddress && (
          <div
            style={{
              marginTop: 16,
              background: C.surface,
              border: `0.5px solid ${C.hairline}`,
              borderRadius: 10,
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <MapPin size={16} strokeWidth={2} style={{ color: C.muted, flexShrink: 0 }} />
            <div
              style={{
                flex: 1,
                fontSize: 11,
                color: C.muted,
                margin: 0,
                lineHeight: 1.4,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Pickup at {pickupAddress}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "12px 16px",
          background: C.surface,
          borderTop: `0.5px solid ${C.hairline}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          margin: "0 -24px -8px",
        }}
      >
        <button
          type="button"
          onClick={onSkip}
          disabled={booking}
          style={{
            background: "transparent",
            border: "none",
            padding: "8px 14px",
            fontSize: 14,
            fontWeight: 500,
            color: C.muted,
            cursor: booking ? "default" : "pointer",
          }}
        >
          Skip — finish
        </button>
        <button
          type="button"
          onClick={handleBook}
          disabled={booking || selectedIdx == null || slots.length === 0}
          style={{
            background: C.link,
            border: "none",
            borderRadius: 10,
            padding: "10px 20px",
            cursor: booking || selectedIdx == null ? "default" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 14,
            fontWeight: 500,
            color: "#FFFFFF",
            opacity: selectedIdx == null || slots.length === 0 ? 0.4 : 1,
          }}
        >
          {booking ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check size={14} strokeWidth={2} />
          )}
          Book &amp; finish
        </button>
      </div>
    </div>
  );
}
