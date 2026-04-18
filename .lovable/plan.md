
Yes — the numbers will update automatically when lessons are added, changed, or removed. Here's why:

## How updates flow today

1. **`useGlobalLessonSync`** is mounted at the layout level and listens to realtime changes on `scheduled_lessons` filtered by `instructor_id`.
2. On any INSERT/UPDATE/DELETE it invalidates the related React Query caches, including:
   - `today-overview` (drives lesson count, hours, expected earnings)
   - `today-remaining-lessons` (drives today's list + amount sums)
   - `day-lessons` (drives tomorrow's list + amount sums)
3. The `HomeTodaySchedule` component reads from those exact hooks, so when caches invalidate it refetches and recomputes:
   - Lesson count
   - Total hours
   - Earnings (sum of `amountDue`, or hours × derived hourly rate as fallback)

Additionally each hook uses `refetchOnMount: "always"` and `refetchOnWindowFocus: true`, so even without realtime (e.g. backgrounded tab) the numbers refresh when the user returns.

## One small gap worth noting

`day-lessons` (used for the Tomorrow tab) is **not** in the `LESSON_QUERY_KEYS` invalidation list in `useGlobalLessonSync.ts`. Today it still updates because of `refetchOnWindowFocus` + the 15s `staleTime`, but for true instant realtime updates on the Tomorrow tab we should add `"day-lessons"` to that list.

## Proposed change (1 line)

Add `"day-lessons"` to `LESSON_QUERY_KEYS` in `src/hooks/useGlobalLessonSync.ts` so Tomorrow's totals update instantly when a lesson is booked for tomorrow.

No other changes needed — Today's numbers already update live.
