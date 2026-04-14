import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  isIndexedDBSupported,
  putItems,
  putItem,
  clearStore,
  setMetadata,
} from "@/lib/offlineStorage";
import { format, addDays, subDays } from "date-fns";

interface UseOfflinePrefetchOptions {
  instructorId?: string;
}

export function useOfflinePrefetch({ instructorId }: UseOfflinePrefetchOptions) {
  const hasPrefetched = useRef(false);
  const isSupported = isIndexedDBSupported();

  const prefetchAll = useCallback(async () => {
    if (!isSupported || !instructorId || !navigator.onLine) return;

    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const weekAhead = format(addDays(new Date(), 7), "yyyy-MM-dd");
      const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");

      // 1. Schedules (past week + week ahead)
      const { data: schedules } = await supabase
        .from("scheduled_lessons")
        .select("*, pupils!inner(id, name, phone, postcode, address, profile_image_url)")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", weekAgo)
        .lte("lesson_date", weekAhead)
        .order("lesson_date")
        .order("start_time");

      if (schedules) {
        await clearStore("schedules");
        await putItems("schedules", schedules);
        await setMetadata("schedules_lastUpdated", new Date().toISOString());
      }

      // 2. Pupils
      const { data: pupils } = await supabase
        .from("pupils")
        .select("id, name, phone, postcode, address, status, profile_image_url, account_balance, prepaid_hours, previous_experience, instructor_id")
        .eq("instructor_id", instructorId);

      if (pupils) {
        await clearStore("pupils");
        await putItems("pupils", pupils);
        await setMetadata("pupils_lastUpdated", new Date().toISOString());
      }

      // 3. Instructor profile
      const { data: profile } = await supabase
        .from("instructors")
        .select("id, name, email, phone, profile_image_url, home_postcode, hourly_rate, is_active")
        .eq("id", instructorId)
        .single();

      if (profile) {
        await putItem("instructorProfile", profile);
        await setMetadata("instructorProfile_lastUpdated", new Date().toISOString());
      }

      // 4. Lesson history (last 30 completed lessons)
      const { data: history } = await supabase
        .from("scheduled_lessons")
        .select("id, pupil_id, lesson_date, start_time, duration_minutes, status, lesson_type, notes, payment_status, amount_due")
        .eq("instructor_id", instructorId)
        .eq("status", "completed")
        .order("lesson_date", { ascending: false })
        .limit(30);

      if (history) {
        await clearStore("lessonHistory");
        await putItems("lessonHistory", history.map(h => ({ ...h, date: h.lesson_date })));
        await setMetadata("lessonHistory_lastUpdated", new Date().toISOString());
      }

      console.log("[OfflinePrefetch] Cached all data for offline use");
    } catch (err) {
      console.warn("[OfflinePrefetch] Partial cache failure:", err);
    }
  }, [isSupported, instructorId]);

  // Run once on mount when online
  useEffect(() => {
    if (!hasPrefetched.current && instructorId && navigator.onLine) {
      hasPrefetched.current = true;
      prefetchAll();
    }
  }, [instructorId, prefetchAll]);

  // Re-cache when coming back online
  useEffect(() => {
    const handleOnline = () => {
      if (instructorId) prefetchAll();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [instructorId, prefetchAll]);

  return { prefetchAll };
}
