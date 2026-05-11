import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Lesson {
  id: string;
  start_time: string;
  duration_minutes: number;
  pickup_postcode?: string | null;
  pupil?: {
    postcode?: string;
  };
}

interface TravelTime {
  fromLessonId: string;
  toLessonId: string;
  fromPostcode: string;
  toPostcode: string;
  durationMinutes: number | null;
  durationText: string | null;
  gapMinutes: number; // Time between lessons
  status: "plenty" | "tight" | "late" | "unknown";
  isLoading: boolean;
}

// Module-level caches shared across all hook instances.
// - resultCache: postcode-pair -> duration in minutes (or null = known unavailable)
// - inflight: postcode-pair -> in-flight promise so duplicate pairs share one call
const resultCache = new Map<string, number | null>();
const inflight = new Map<string, Promise<number | null>>();

const cacheKey = (from: string, to: string) =>
  `${from.toUpperCase().replace(/\s+/g, "")}|${to.toUpperCase().replace(/\s+/g, "")}`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchDuration(from: string, to: string): Promise<number | null> {
  const key = cacheKey(from, to);
  if (resultCache.has(key)) return resultCache.get(key)!;
  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = (async () => {
    // Up to 3 attempts with backoff on rate-limit / transient errors
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const { data, error } = await supabase.functions.invoke("calculate-route-distance", {
          body: { from_postcode: from, to_postcode: to },
        });
        if (error) throw error;
        const minutes = (data?.duration_minutes as number | undefined) ?? null;
        resultCache.set(key, minutes);
        return minutes;
      } catch (err: any) {
        const msg = String(err?.message ?? err);
        const isRateLimit = msg.includes("429") || msg.includes("RATE_LIMIT");
        if (attempt < 2) {
          await sleep(isRateLimit ? 1500 * (attempt + 1) : 500);
          continue;
        }
        // Give up — don't cache so it can be retried later
        return null;
      }
    }
    return null;
  })();

  inflight.set(key, promise);
  try { return await promise; } finally { inflight.delete(key); }
}

export function useLessonTravelTimes(lessons: Lesson[]) {
  const [travelTimes, setTravelTimes] = useState<Map<string, TravelTime>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Memoize consecutive lesson pairs
  const lessonPairs = useMemo(() => {
    if (lessons.length < 2) return [];
    
    const pairs: Array<{
      from: Lesson;
      to: Lesson;
      fromPostcode: string;
      toPostcode: string;
      gapMinutes: number;
    }> = [];

    for (let i = 0; i < lessons.length - 1; i++) {
      const from = lessons[i];
      const to = lessons[i + 1];
      
      const fromPostcode = from.pickup_postcode || from.pupil?.postcode;
      const toPostcode = to.pickup_postcode || to.pupil?.postcode;
      
      // Skip invalid postcodes (must look like a UK postcode)
      const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
      if (!fromPostcode || !toPostcode || !postcodeRegex.test(fromPostcode) || !postcodeRegex.test(toPostcode)) continue;
      
      // Calculate gap between lessons
      const fromEndTime = addMinutesToTime(from.start_time, from.duration_minutes);
      const gapMinutes = getMinutesBetween(fromEndTime, to.start_time);
      
      pairs.push({
        from,
        to,
        fromPostcode,
        toPostcode,
        gapMinutes,
      });
    }
    
    return pairs;
  }, [lessons]);

  // Fetch travel times for all pairs
  useEffect(() => {
    if (lessonPairs.length === 0) {
      setTravelTimes(new Map());
      return;
    }

    let cancelled = false;
    const fetchTravelTimes = async () => {
      setIsLoading(true);
      const newTravelTimes = new Map<string, TravelTime>();

      // Initialize with loading state
      for (const pair of lessonPairs) {
        const key = `${pair.from.id}-${pair.to.id}`;
        newTravelTimes.set(key, {
          fromLessonId: pair.from.id,
          toLessonId: pair.to.id,
          fromPostcode: pair.fromPostcode,
          toPostcode: pair.toPostcode,
          durationMinutes: null,
          durationText: null,
          gapMinutes: pair.gapMinutes,
          status: "unknown",
          isLoading: true,
        });
      }
      setTravelTimes(new Map(newTravelTimes));

      // Process pairs serially to avoid rate-limiting; cache dedupes repeated postcodes
      for (const pair of lessonPairs) {
        if (cancelled) return;
        const durationMinutes = await fetchDuration(pair.fromPostcode, pair.toPostcode);
        const durationText = durationMinutes !== null ? `~${durationMinutes} min` : null;

        let status: TravelTime["status"] = "unknown";
        if (durationMinutes !== null) {
          const buffer = pair.gapMinutes - durationMinutes;
          status = buffer >= 15 ? "plenty" : buffer >= 5 ? "tight" : "late";
        }

        const key = `${pair.from.id}-${pair.to.id}`;
        newTravelTimes.set(key, {
          fromLessonId: pair.from.id,
          toLessonId: pair.to.id,
          fromPostcode: pair.fromPostcode,
          toPostcode: pair.toPostcode,
          durationMinutes,
          durationText,
          gapMinutes: pair.gapMinutes,
          status,
          isLoading: false,
        });
        if (!cancelled) setTravelTimes(new Map(newTravelTimes));
      }

      if (!cancelled) setIsLoading(false);
    };

    fetchTravelTimes();
    return () => { cancelled = true; };
  }, [lessonPairs]);

  return {
    travelTimes,
    isLoading,
    getTravelTime: (fromLessonId: string, toLessonId: string) =>
      travelTimes.get(`${fromLessonId}-${toLessonId}`),
  };
}

// Helper functions
function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, "0")}:${String(newMins).padStart(2, "0")}`;
}

function getMinutesBetween(time1: string, time2: string): number {
  const [h1, m1] = time1.split(":").map(Number);
  const [h2, m2] = time2.split(":").map(Number);
  return (h2 * 60 + m2) - (h1 * 60 + m1);
}
