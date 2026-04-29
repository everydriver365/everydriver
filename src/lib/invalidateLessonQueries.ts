import type { QueryClient } from "@tanstack/react-query";

/**
 * Keys that depend on scheduled_lessons. Mirrors LESSON_QUERY_KEYS in
 * useGlobalLessonSync but is callable directly from mutation handlers so
 * the UI updates instantly instead of waiting for the realtime round-trip.
 */
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
  "day-lesson-history",
];

export function invalidateLessonQueries(queryClient: QueryClient) {
  LESSON_QUERY_KEYS.forEach((k) => {
    queryClient.invalidateQueries({ queryKey: [k] });
  });
}
