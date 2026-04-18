import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeSubscription } from "@/hooks/useRealtimeHub";

const LESSON_QUERY_KEYS = [
  "today-overview",
  "today-remaining-lessons",
  "next-lesson-details",
  "weekly-goals",
  "monthly-goals",
  "instructor-streak",
  "tomorrow-preview",
  "tomorrow-lessons",
  "gap-suggestions",
  "instructor-calendar",
  "instructor-live-stats",
  "break-reminders",
  "lesson-end-alert",
  "today-route",
  "quick-tile-actions",
  "gap-slots",
  "last-week-comparison",
  "day-lessons",
];

const PUPIL_QUERY_KEYS = [
  "pupils",
  "pupil-detail",
  "instructor-live-stats",
  "today-remaining-lessons",
];

const PAYMENT_QUERY_KEYS = [
  "payment-history",
  "instructor-live-stats",
  "pupil-detail",
];

/**
 * Global realtime sync hook — mount once at the layout level.
 * Listens for changes to scheduled_lessons, pupils, and payment_history,
 * then invalidates all related query caches so every page stays fresh.
 */
export function useGlobalLessonSync(instructorId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidateLessonQueries = useCallback(() => {
    LESSON_QUERY_KEYS.forEach((k) =>
      queryClient.invalidateQueries({ queryKey: [k] })
    );
  }, [queryClient]);

  const invalidatePupilQueries = useCallback(() => {
    PUPIL_QUERY_KEYS.forEach((k) =>
      queryClient.invalidateQueries({ queryKey: [k] })
    );
  }, [queryClient]);

  const invalidatePaymentQueries = useCallback(() => {
    PAYMENT_QUERY_KEYS.forEach((k) =>
      queryClient.invalidateQueries({ queryKey: [k] })
    );
  }, [queryClient]);

  const filter = instructorId
    ? `instructor_id=eq.${instructorId}`
    : undefined;
  const enabled = !!instructorId;

  useRealtimeSubscription("scheduled_lessons", "*", invalidateLessonQueries, {
    filter,
    enabled,
  });

  useRealtimeSubscription("pupils", "*", invalidatePupilQueries, {
    filter,
    enabled,
  });

  useRealtimeSubscription("payment_history", "*", invalidatePaymentQueries, {
    filter,
    enabled,
  });
}
