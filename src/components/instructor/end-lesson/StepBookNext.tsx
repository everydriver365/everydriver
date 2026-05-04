import { useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, parse, differenceInCalendarDays } from "date-fns";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateLessonQueries } from "@/lib/invalidateLessonQueries";
import { checkLessonClash, describeLessonClashError } from "@/lib/lessonClashCheck";

import { titleCaseName } from "@/lib/titleCase";
import { UserAvatar } from "@/components/instructor/UserAvatar";

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
  /** ID of the lesson just completed — used to read its lesson_type for subtitle fallback. */
  lessonId?: string;
  onBooked: () => void;
  onSkip: () => void;
}

type SlotCategory = "best" | "pattern" | "gap" | "preference" | "urgency";

interface SuggestedSlot {
  date: string;
  startTime: string;
  category: SlotCategory;
  reasoning: string;
  /** True only when this slot was generated from a real 3+ historical pattern match. */
  isGenuineBestMatch?: boolean;
}

// Heuristic for the existing "Review" flag — corrupted / suspicious pupil names.
// Triggers on: known sentinel words, dangerous chars, all-consonant strings,
// repeated-letter runs ("Daaf", "Aaaa"), or short non-name tokens.
function needsNameReview(name: string): boolean {
  if (!name) return false;
  const t = name.trim();
  if (!t) return false;
  if (/^(unknown|n\/a|none|test|tbc|tba)$/i.test(t)) return true;
  if (/[<>{}\\@#$%^*]/.test(t)) return true;
  // First token only — surnames legitimately vary more
  const first = t.split(/\s+/)[0];
  if (!first) return false;
  // Repeated-letter run of 2+ same chars in a row (e.g. "Daaf", "Aaaa", "Jooe")
  if (/(.)\1{1,}/i.test(first) && first.length <= 5) return true;
  // All consonants (no vowels and no 'y')
  if (first.length >= 3 && !/[aeiouy]/i.test(first)) return true;
  return false;
}

interface PupilContext {
  homePostcode: string | null;
  homeAddress: string | null;
  testDate: string | null;
  courseName: string | null;
  courseHoursTotal: number | null;
  courseHoursRemaining: number | null;
  lessonType: string | null;
}

export function StepBookNext({
  pupilId,
  pupilName,
  instructorId,
  durationMinutes,
  todayStartTime,
  lessonId,
  onBooked,
  onSkip,
}: StepBookNextProps) {
  const queryClient = useQueryClient();
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
    lessonType: null,
  });

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    try {
      // ---- Pupil + preferences ----
      const { data: pupil } = await supabase
        .from("pupils")
        .select("postcode, address, test_date, preferred_days, preferred_times")
        .eq("id", pupilId)
        .maybeSingle();

      const preferredDays = ((pupil as any)?.preferred_days || []) as string[]; // e.g. ["monday","wednesday"]
      const preferredTimes = ((pupil as any)?.preferred_times || []) as string[]; // e.g. ["morning","afternoon"]

      // ---- Active course (pupil_packages JOIN lesson_packages) ----
      let courseName: string | null = null;
      let courseHoursTotal: number | null = null;
      let courseHoursRemaining: number | null = null;
      try {
        const { data: pkg } = await (supabase as any)
          .from("pupil_packages")
          .select("hours_purchased, hours_remaining, status, lesson_packages(name)")
          .eq("pupil_id", pupilId)
          .eq("status", "active")
          .order("purchased_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (pkg) {
          courseName = pkg.lesson_packages?.name ?? null;
          courseHoursTotal =
            typeof pkg.hours_purchased === "number" ? pkg.hours_purchased : null;
          courseHoursRemaining =
            typeof pkg.hours_remaining === "number" ? pkg.hours_remaining : null;
        }
      } catch {
        /* table optional */
      }

      // ---- Just-completed lesson type (subtitle fallback) ----
      let lessonType: string | null = null;
      if (lessonId) {
        try {
          const { data: l } = await supabase
            .from("scheduled_lessons")
            .select("lesson_type")
            .eq("id", lessonId)
            .maybeSingle();
          lessonType = (l as any)?.lesson_type || null;
        } catch {
          /* ignore */
        }
      }

      setPupilCtx({
        homePostcode: (pupil as any)?.postcode ?? null,
        homeAddress: (pupil as any)?.address ?? null,
        testDate: (pupil as any)?.test_date ?? null,
        courseName,
        courseHoursTotal,
        courseHoursRemaining,
        lessonType,
      });

      // ---- Instructor preferences + buffer + travel ----
      const { data: instructorData } = await supabase
        .from("instructors")
        .select("prefer_earliest_slot, buffer_minutes, home_postcode")
        .eq("id", instructorId)
        .maybeSingle();
      const preferEarliest = (instructorData as any)?.prefer_earliest_slot ?? false;
      const bufferMinutes = (instructorData as any)?.buffer_minutes ?? 0;
      const homePostcode = (instructorData as any)?.home_postcode;
      const pupilPostcode = (pupil as any)?.postcode;

      // Travel-from-home is now resolved lazily via the pairwise travelCache
      // inside isAvailable() (first-of-day check), so no upfront fetch needed.
      const bufferMs = bufferMinutes * 60000;

      // ---- Pupil's booking history (for genuine 3+ pattern detection) ----
      const { data: pastLessons } = await supabase
        .from("scheduled_lessons")
        .select("lesson_date, start_time")
        .eq("pupil_id", pupilId)
        .eq("instructor_id", instructorId)
        .neq("status", "cancelled")
        .order("lesson_date", { ascending: false })
        .limit(20);

      // Group by exact (DOW, HH:MM) bucket — threshold 3 = genuine pattern.
      const dowTimeBuckets: Record<string, number> = {};
      (pastLessons || []).forEach((l) => {
        const d = parse(l.lesson_date as string, "yyyy-MM-dd", new Date());
        const hhmm = (l.start_time as string).slice(0, 5);
        const key = `${d.getDay()}|${hhmm}`;
        dowTimeBuckets[key] = (dowTimeBuckets[key] || 0) + 1;
      });
      const genuinePatterns = Object.entries(dowTimeBuckets)
        .filter(([, n]) => n >= 3)
        .map(([k]) => {
          const [dow, hhmm] = k.split("|");
          return { dow: parseInt(dow, 10), hhmm };
        });

      // ---- Conflict / availability data for next 7 days ----
      const today = new Date();
      const todayStr = format(today, "yyyy-MM-dd");
      const weekLaterStr = format(addDays(today, 7), "yyyy-MM-dd");
      const todayISO = today.toISOString();
      const weekLaterISO = addDays(today, 7).toISOString();

      const [
        { data: calendarEvents },
        { data: workingHours },
        { data: dateOverrides },
        { data: manualBlocks },
      ] = await Promise.all([
        supabase
          .from("instructor_calendar_events")
          .select("start_time, end_time")
          .eq("instructor_id", instructorId)
          .eq("is_busy", true)
          .gte("end_time", `${todayStr}T00:00:00`)
          .lte("start_time", `${weekLaterStr}T23:59:59`),
        supabase
          .from("instructor_working_hours")
          .select("day_of_week, start_time, end_time, is_active")
          .eq("instructor_id", instructorId)
          .eq("is_active", true),
        supabase
          .from("instructor_date_overrides")
          .select("override_date, is_available, start_time, end_time")
          .eq("instructor_id", instructorId)
          .gte("override_date", todayStr)
          .lte("override_date", weekLaterStr),
        supabase
          .from("instructor_manual_blocks")
          .select("start_datetime, end_datetime")
          .eq("instructor_id", instructorId)
          .gte("end_datetime", todayISO)
          .lte("start_datetime", weekLaterISO),
      ]);

      // Pairwise travel cache (postcode→postcode→minutes) to avoid duplicate edge calls
      const travelCache = new Map<string, number>();
      const TRAVEL_FALLBACK_MIN = 10;
      const lookupTravelMinutes = async (
        from: string | null | undefined,
        to: string | null | undefined,
      ): Promise<number> => {
        if (!from || !to) return 0;
        const key = `${from.toUpperCase()}→${to.toUpperCase()}`;
        if (travelCache.has(key)) return travelCache.get(key)!;
        try {
          const { data } = await supabase.functions.invoke("check-travel-buffer", {
            body: { from_postcode: from, to_postcode: to },
          });
          const mins =
            typeof (data as any)?.travel_minutes === "number"
              ? (data as any).travel_minutes
              : TRAVEL_FALLBACK_MIN;
          travelCache.set(key, mins);
          return mins;
        } catch {
          travelCache.set(key, TRAVEL_FALLBACK_MIN);
          return TRAVEL_FALLBACK_MIN;
        }
      };

      // Cache day's existing lessons (with pupil postcode for travel),
      // cal-busy windows, manual blocks, and the day's working window.
      type DayLesson = {
        start_time: string;
        duration_minutes: number | null;
        pupil_id: string | null;
        pupil_postcode: string | null;
      };
      type DayCacheEntry = {
        existing: DayLesson[];
        cal: Array<{ start: Date; end: Date }>;
        blocks: Array<{ start: Date; end: Date }>;
        /** Working window on this day (epoch ms). null => instructor not working. */
        window: { start: number; end: number } | null;
      };
      const dayCache = new Map<string, DayCacheEntry>();

      const normTime = (t: string) => (t.length === 5 ? `${t}:00` : t);

      for (let d = 1; d <= 7; d++) {
        const date = addDays(today, d);
        const dateStr = format(date, "yyyy-MM-dd");

        // Day window from override or working hours
        const override = (dateOverrides || []).find(
          (o: any) => o.override_date === dateStr,
        );
        let window: { start: number; end: number } | null = null;
        if (override) {
          if ((override as any).is_available !== false) {
            const ws = (override as any).start_time || "09:00:00";
            const we = (override as any).end_time || "17:00:00";
            window = {
              start: parse(normTime(ws), "HH:mm:ss", date).getTime(),
              end: parse(normTime(we), "HH:mm:ss", date).getTime(),
            };
          }
        } else {
          const wh = (workingHours || []).find(
            (h: any) => h.day_of_week === date.getDay(),
          );
          if (wh) {
            window = {
              start: parse(normTime((wh as any).start_time), "HH:mm:ss", date).getTime(),
              end: parse(normTime((wh as any).end_time), "HH:mm:ss", date).getTime(),
            };
          }
        }

        // Existing lessons on this day, with pupil postcode for travel calc
        const { data: existing } = await supabase
          .from("scheduled_lessons")
          .select("start_time, duration_minutes, pupil_id, pupils(postcode)")
          .eq("instructor_id", instructorId)
          .eq("lesson_date", dateStr)
          .neq("status", "cancelled")
          .order("start_time");

        const dayLessons: DayLesson[] = (existing || []).map((row: any) => ({
          start_time: row.start_time,
          duration_minutes: row.duration_minutes,
          pupil_id: row.pupil_id ?? null,
          pupil_postcode: row.pupils?.postcode ?? null,
        }));

        const dayCalBusy = (calendarEvents || [])
          .map((ev: any) => ({ start: new Date(ev.start_time), end: new Date(ev.end_time) }))
          .filter((ev) => {
            if (ev.end.getTime() - ev.start.getTime() >= 24 * 60 * 60 * 1000) return false;
            return format(ev.start, "yyyy-MM-dd") === dateStr;
          });

        const dayStartMs = parse("00:00:00", "HH:mm:ss", date).getTime();
        const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000;
        const dayBlocks = (manualBlocks || [])
          .map((b: any) => ({ start: new Date(b.start_datetime), end: new Date(b.end_datetime) }))
          .filter((b) => b.start.getTime() < dayEndMs && b.end.getTime() > dayStartMs);

        dayCache.set(dateStr, {
          existing: dayLessons,
          cal: dayCalBusy,
          blocks: dayBlocks,
          window,
        });
      }

      // ---- Slot availability check (shared, async for travel lookups) ----
      // Respects: working hours, date overrides, manual blocks, calendar busy,
      // existing lessons, instructor buffer, and per-pupil travel between
      // adjacent lessons (not just first-of-day).
      const isAvailable = async (dateStr: string, hhmmss: string): Promise<boolean> => {
        const date = parse(dateStr, "yyyy-MM-dd", new Date());
        const cached = dayCache.get(dateStr);
        if (!cached) return false;

        // Hard gate: instructor not working this day
        if (!cached.window) return false;

        const candidateStart = parse(hhmmss, "HH:mm:ss", date).getTime();
        const candidateEnd = candidateStart + durationMinutes * 60000;

        // Inside working window
        if (candidateStart < cached.window.start || candidateEnd > cached.window.end) {
          return false;
        }

        // Manual blocks (hard, no buffer — they're explicit blocks)
        const blockConflict = cached.blocks.some(
          (b) => candidateStart < b.end.getTime() && candidateEnd > b.start.getTime(),
        );
        if (blockConflict) return false;

        // Calendar busy (with buffer either side)
        const calConflict = cached.cal.some(
          (ev) =>
            candidateStart < ev.end.getTime() + bufferMs &&
            candidateEnd > ev.start.getTime() - bufferMs,
        );
        if (calConflict) return false;

        // First-lesson-of-day travel from instructor's home
        const hasEarlierCommitment =
          cached.existing.some(
            (ex) => parse(ex.start_time, "HH:mm:ss", date).getTime() < candidateStart,
          ) || cached.cal.some((ev) => ev.start.getTime() < candidateStart);
        if (!hasEarlierCommitment) {
          const homeTravel = await lookupTravelMinutes(homePostcode, pupilPostcode);
          const firstSlotBuffer = Math.max(homeTravel, bufferMinutes);
          const earliestAllowed = cached.window.start + firstSlotBuffer * 60000;
          if (candidateStart < earliestAllowed) return false;
        }

        // Direct overlap with any existing lesson (with buffer)
        const lessons = [...cached.existing].sort(
          (a, b) =>
            parse(a.start_time, "HH:mm:ss", date).getTime() -
            parse(b.start_time, "HH:mm:ss", date).getTime(),
        );
        const overlap = lessons.some((ex) => {
          const exStart = parse(ex.start_time, "HH:mm:ss", date).getTime();
          const exEnd = exStart + ((ex.duration_minutes as number) || 60) * 60000;
          return candidateStart < exEnd + bufferMs && candidateEnd > exStart - bufferMs;
        });
        if (overlap) return false;

        // Travel to/from immediately adjacent pupils
        let prev: DayLesson | null = null;
        let next: DayLesson | null = null;
        for (const ex of lessons) {
          const exStart = parse(ex.start_time, "HH:mm:ss", date).getTime();
          if (exStart < candidateStart) prev = ex;
          else if (exStart >= candidateEnd && !next) next = ex;
        }

        if (prev) {
          const prevEnd =
            parse(prev.start_time, "HH:mm:ss", date).getTime() +
            ((prev.duration_minutes as number) || 60) * 60000;
          const travel = await lookupTravelMinutes(prev.pupil_postcode, pupilPostcode);
          const required = Math.max(travel, bufferMinutes) * 60000;
          if (candidateStart < prevEnd + required) return false;
        }
        if (next) {
          const nextStart = parse(next.start_time, "HH:mm:ss", date).getTime();
          const travel = await lookupTravelMinutes(pupilPostcode, next.pupil_postcode);
          const required = Math.max(travel, bufferMinutes) * 60000;
          if (candidateEnd + required > nextStart) return false;
        }

        return true;
      };

      // ---- Category-driven candidate pipeline ----
      const candidates: SuggestedSlot[] = [];
      const usedReasonings = new Set<string>();
      const usedSlotKeys = new Set<string>();

      const pushIfFresh = (slot: SuggestedSlot) => {
        const slotKey = `${slot.date}|${slot.startTime}`;
        if (usedSlotKeys.has(slotKey)) return false;
        if (usedReasonings.has(slot.reasoning)) return false;
        usedSlotKeys.add(slotKey);
        usedReasonings.add(slot.reasoning);
        candidates.push(slot);
        return true;
      };

      // 1) BEST MATCH — first available genuine 3+ pattern slot in next 7 days
      for (const pattern of genuinePatterns) {
        if (candidates.length >= 3) break;
        for (let d = 1; d <= 7; d++) {
          const date = addDays(today, d);
          if (date.getDay() !== pattern.dow) continue;
          const hhmmss = `${pattern.hhmm}:00`;
          const dateStr = format(date, "yyyy-MM-dd");
          if (!(await isAvailable(dateStr, hhmmss))) continue;
          const dayName = format(date, "EEEE");
          const reasoning = `Pupil's usual ${dayName}`;
          const added = pushIfFresh({
            date: dateStr,
            startTime: hhmmss,
            category: "best",
            reasoning,
            isGenuineBestMatch: true,
          });
          if (added) break; // one instance per pattern
        }
      }

      // 2) GAP FILL — sandwich detection in next 7 days
      if (candidates.length < 3) {
        for (let d = 1; d <= 7 && candidates.length < 3; d++) {
          const date = addDays(today, d);
          const dateStr = format(date, "yyyy-MM-dd");
          const cached = dayCache.get(dateStr);
          if (!cached || cached.existing.length < 2) continue;
          const candidateTimes = ["09:00:00", "10:30:00", "11:00:00", "13:00:00", "15:00:00"];
          for (const ct of candidateTimes) {
            if (!(await isAvailable(dateStr, ct))) continue;
            const candidateStart = parse(ct, "HH:mm:ss", date).getTime();
            const candidateEnd = candidateStart + durationMinutes * 60000;
            const before = cached.existing.find((ex) => {
              const exStart = parse(ex.start_time, "HH:mm:ss", date).getTime();
              const exEnd = exStart + ((ex.duration_minutes as number) || 60) * 60000;
              return exEnd <= candidateStart;
            });
            const after = cached.existing.find((ex) => {
              const exStart = parse(ex.start_time, "HH:mm:ss", date).getTime();
              return exStart >= candidateEnd;
            });
            if (before && after) {
              const added = pushIfFresh({
                date: dateStr,
                startTime: ct,
                category: "gap",
                reasoning: "Fills a gap in your schedule",
              });
              if (added) break;
            }
          }
        }
      }

      // 3) PUPIL PREFERENCE — explicit preferred_days / preferred_times
      const dayNameToIdx: Record<string, number> = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
      };
      if (candidates.length < 3 && (preferredDays.length > 0 || preferredTimes.length > 0)) {
        const candidateTimes = preferEarliest
          ? ["09:00:00", "09:30:00", "10:00:00", "10:30:00", "11:00:00", "13:00:00", "15:00:00"]
          : ["09:00:00", "11:00:00", "13:00:00", "15:00:00"];
        for (let d = 1; d <= 7 && candidates.length < 3; d++) {
          const date = addDays(today, d);
          const dateStr = format(date, "yyyy-MM-dd");
          const dayMatchesPref =
            preferredDays.length === 0 ||
            preferredDays.some((dn) => dayNameToIdx[dn.toLowerCase()] === date.getDay());
          if (!dayMatchesPref) continue;
          for (const ct of candidateTimes) {
            const hour = parseInt(ct.slice(0, 2), 10);
            const tod = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
            const timeMatchesPref =
              preferredTimes.length === 0 || preferredTimes.includes(tod);
            if (!timeMatchesPref) continue;
            if (!(await isAvailable(dateStr, ct))) continue;
            // Reasoning: prefer day-name when explicit, else time-of-day
            let reasoning: string;
            if (preferredDays.length > 0) {
              reasoning = `Pupil's preferred ${format(date, "EEEE")}`;
            } else {
              reasoning = `Pupil's preferred ${tod}s`;
            }
            const added = pushIfFresh({
              date: dateStr,
              startTime: ct,
              category: "preference",
              reasoning,
            });
            if (added) break;
          }
        }
      }

      // 4) TEST-PREP URGENCY — only when test_date ≤ 21 days away
      const testDateRaw = (pupil as any)?.test_date as string | undefined;
      if (candidates.length < 3 && testDateRaw) {
        try {
          const testDate = parse(testDateRaw, "yyyy-MM-dd", new Date());
          const daysToTest = differenceInCalendarDays(testDate, today);
          if (daysToTest >= 0 && daysToTest <= 21 && todayStartTime) {
            for (let d = 1; d <= 7 && candidates.length < 3; d++) {
              const date = addDays(today, d);
              const dateStr = format(date, "yyyy-MM-dd");
              if (!(await isAvailable(dateStr, todayStartTime))) continue;
              const remaining = differenceInCalendarDays(testDate, date);
              const added = pushIfFresh({
                date: dateStr,
                startTime: todayStartTime,
                category: "urgency",
                reasoning: `Test in ${remaining} days · keeps pace`,
              });
              if (added) break;
            }
          }
        } catch {
          /* ignore */
        }
      }

      // 5) PATTERN CONTINUATION (Step-3 fallbacks) — honest defaults
      // 5a) Same time next week
      if (candidates.length < 3 && todayStartTime) {
        const date = addDays(today, 7);
        const dateStr = format(date, "yyyy-MM-dd");
        if (await isAvailable(dateStr, todayStartTime)) {
          pushIfFresh({
            date: dateStr,
            startTime: todayStartTime,
            category: "pattern",
            reasoning: "Same time next week",
          });
        }
      }
      // 5b) Tomorrow's first opening
      if (candidates.length < 3) {
        const tomorrow = addDays(today, 1);
        const tomorrowStr = format(tomorrow, "yyyy-MM-dd");
        const candidateTimes = preferEarliest
          ? ["09:00:00", "09:30:00", "10:00:00", "10:30:00", "11:00:00", "13:00:00", "15:00:00"]
          : ["09:00:00", "10:00:00", "11:00:00", "13:00:00", "15:00:00"];
        for (const ct of candidateTimes) {
          if (await isAvailable(tomorrowStr, ct)) {
            const hr = parseInt(ct.slice(0, 2), 10);
            const tod = hr < 12 ? "morning" : hr < 17 ? "afternoon" : "evening";
            pushIfFresh({
              date: tomorrowStr,
              startTime: ct,
              category: "pattern",
              reasoning: `Tomorrow ${tod}`,
            });
            break;
          }
        }
      }
      // 5c) Two days from now, same time
      if (candidates.length < 3 && todayStartTime) {
        const date = addDays(today, 2);
        const dateStr = format(date, "yyyy-MM-dd");
        if (await isAvailable(dateStr, todayStartTime)) {
          pushIfFresh({
            date: dateStr,
            startTime: todayStartTime,
            category: "pattern",
            reasoning: "Same time, in 2 days",
          });
        }
      }

      // ---- Sort: genuine best-match first, then chronological ascending ----
      candidates.sort((a, b) => {
        const aBest = a.isGenuineBestMatch ? 1 : 0;
        const bBest = b.isGenuineBestMatch ? 1 : 0;
        if (aBest !== bBest) return bBest - aBest;
        const aKey = `${a.date}T${a.startTime}`;
        const bKey = `${b.date}T${b.startTime}`;
        return aKey.localeCompare(bKey);
      });

      const out = candidates.slice(0, 3);
      setSlots(out);
      // Pre-select the first slot for tap-to-confirm flow
      if (out.length > 0) setSelectedIdx(0);
    } catch (e) {
      console.error("Error finding slots:", e);
    } finally {
      setLoading(false);
    }
  };

  const displayName = useMemo(() => titleCaseName(pupilName) || pupilName, [pupilName]);
  const showReview = needsNameReview(pupilName);

  // Note: the old `subtitle` memo (course / test prep / lesson type) is no
  // longer rendered — the conversational headline + supporting line carry the
  // context. Course hours, when present, are appended to the supporting line.

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
      invalidateLessonQueries(queryClient);
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
    <div
      style={{
        fontFamily: FONT_STACK,
        color: C.text,
        background: "#FFFFFF",
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Pupil identity bar — white, full-bleed, matches Lesson Summary */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: `0.5px solid ${C.hairline}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "#FFFFFF",
          flexShrink: 0,
        }}
      >
        <UserAvatar name={displayName} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 1,
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: C.text,
                letterSpacing: -0.1,
                margin: 0,
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
                }}
              >
                Review
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: C.muted, margin: 0 }}>
            {(() => {
              if (pupilCtx.testDate) {
                try {
                  return `Test prep · test on ${format(parse(pupilCtx.testDate, "yyyy-MM-dd", new Date()), "d MMM")}`;
                } catch {
                  /* fall through */
                }
              }
              if (
                pupilCtx.courseName &&
                pupilCtx.courseHoursTotal != null &&
                pupilCtx.courseHoursRemaining != null
              ) {
                return `${pupilCtx.courseName} · ${pupilCtx.courseHoursRemaining}h of ${pupilCtx.courseHoursTotal}h remaining`;
              }
              const lt = pupilCtx.lessonType
                ? pupilCtx.lessonType.charAt(0).toUpperCase() + pupilCtx.lessonType.slice(1)
                : "Standard lesson";
              const wrapTime = todayStartTime
                ? format(parse(todayStartTime, "HH:mm:ss", new Date()), "HH:mm")
                : null;
              return wrapTime ? `${lt} · ended ${wrapTime}` : lt;
            })()}
          </div>
        </div>
      </div>

      {/* Grey content backdrop */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          background: "#F2F2F4",
          padding: 16,
        }}
      >
        {/* "When next?" eyebrow + Pick another time link */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: C.muted,
              letterSpacing: 0.3,
              textTransform: "uppercase",
            }}
          >
            When next?
          </div>
          <button
            type="button"
            onClick={() => {
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
              background: C.bg,
              border: `0.5px dashed ${C.hairline}`,
              borderRadius: 10,
            }}
          >
            No available slots in the next 7 days. Use “Pick another time” to choose freely.
          </div>
        ) : (
          slots.map((slot, idx) => {
            const dt = parse(slot.date, "yyyy-MM-dd", new Date());
            const isSelected = idx === selectedIdx;
            const isLast = idx === slots.length - 1;
            const r = reasoningColor(slot.category);
            const startDisplay = format(parse(slot.startTime, "HH:mm:ss", dt), "HH:mm");

            // Suggested = the top-ranked slot in the sorted list (always idx 0).
            const isTopRanked = idx === 0;
            // Show the strong "suggested" treatment when this is the top rank
            // AND it is currently the selected slot. Once the user taps another
            // card, that card takes the strong treatment instead.
            const showStrong = isSelected;
            const reasoningText =
              isTopRanked && isSelected ? `${slot.reasoning} · suggested` : slot.reasoning;
            const reasoningColorVal = showStrong ? C.link : r.color;
            const reasoningWeightVal: 400 | 500 = showStrong ? 500 : r.weight;
            const dowColor = showStrong ? C.link : C.muted;

            return (
              <button
                key={`${slot.date}-${slot.startTime}`}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                disabled={booking}
                style={{
                  width: "100%",
                  background: C.bg,
                  border: showStrong
                    ? `1.5px solid ${C.link}`
                    : `0.5px solid ${C.hairline}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                  cursor: booking ? "default" : "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  marginBottom: isLast ? 10 : 8,
                }}
              >
                {/* Date stack */}
                <div
                  style={{
                    flexShrink: 0,
                    minWidth: 42,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: dowColor,
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
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: C.text,
                        letterSpacing: -0.2,
                        margin: 0,
                      }}
                    >
                      {startDisplay}
                    </span>
                    <span style={{ fontSize: 13, color: C.muted }}>·</span>
                    <span style={{ fontSize: 13, color: C.muted, margin: 0 }}>
                      {formatDurationLabel(durationMinutes)}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: reasoningColorVal,
                      fontWeight: reasoningWeightVal,
                      margin: 0,
                    }}
                  >
                    {reasoningText}
                  </div>
                </div>

                {/* Right action — circular check on selected slot, calm chevron otherwise */}
                {showStrong ? (
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 9999,
                      background: C.link,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Check size={14} strokeWidth={2} color="#FFFFFF" />
                  </div>
                ) : (
                  <svg
                    width={12}
                    height={12}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={C.muted}
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0 }}
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                )}
              </button>
            );
          })
        )}

        {/* Pickup location — calm inline row, no card background, sits on grey */}
        {pickupAddress && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 4px 0",
            }}
          >
            <MapPin size={13} strokeWidth={2} style={{ color: C.muted, flexShrink: 0 }} />
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
                whiteSpace: "nowrap",
              }}
            >
              Pickup at {pickupAddress}
            </div>
            <button
              type="button"
              onClick={() => {
                toast.message("Open the pickup picker");
              }}
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                fontSize: 11,
                fontWeight: 500,
                color: C.link,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              Change
            </button>
          </div>
        )}
      </div>

      {/* Footer — pinned, matches Lesson Summary chrome */}
      <div
        style={{
          padding: "12px 16px",
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
          background: C.surface,
          borderTop: `0.5px solid ${C.hairline}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          flexShrink: 0,
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
        {(() => {
          const selSlot = selectedIdx != null ? slots[selectedIdx] : null;
          const bookLabel = (() => {
            if (!selSlot) return "Pick a slot";
            const dt = parse(selSlot.date, "yyyy-MM-dd", new Date());
            const t = format(parse(selSlot.startTime, "HH:mm:ss", dt), "HH:mm");
            return `Book ${format(dt, "EEE")} ${t}`;
          })();
          const disabled = booking || selectedIdx == null || slots.length === 0;
          return (
            <button
              type="button"
              onClick={handleBook}
              disabled={disabled}
              style={{
                background: C.link,
                border: "none",
                borderRadius: 10,
                padding: "11px 22px",
                cursor: disabled ? "not-allowed" : "pointer",
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
              {bookLabel}
            </button>
          );
        })()}
      </div>
    </div>
  );
}
