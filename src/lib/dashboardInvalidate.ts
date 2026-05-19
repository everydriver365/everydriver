// Helper to refresh all instructor dashboard data after mutations
// (add lesson, add pupil, take payment). Call after any successful
// mutation so the tiles, schedule strip and stat counts update
// immediately without waiting for the next focus refetch.

import type { QueryClient } from "@tanstack/react-query";

export function invalidateInstructorDashboard(
  queryClient: QueryClient,
  instructorId: string | undefined,
) {
  if (!instructorId) return;
  // Aggregate stats (lessonsThisMonth, tests booked, courses, etc.)
  queryClient.invalidateQueries({ queryKey: ["instructor-dashboard-stats", instructorId] });
  // Live stats (hours this week, month earnings)
  queryClient.invalidateQueries({ queryKey: ["instructor-live-stats", instructorId] });
  // Today/tomorrow/+3 days schedule strip — prefix match
  queryClient.invalidateQueries({ queryKey: ["day-lessons", instructorId] });
}
