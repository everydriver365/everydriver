

# Fix: Lessons Not Appearing After Creation

## Problem
When you create a new lesson, the homepage tiles (Today's Schedule, Next Up, Today's Mini Timeline) and schedule view don't update because:
1. The queries use `staleTime: 2 * 60 * 1000` (2-minute cache), so they won't refetch until the cache expires
2. There is **no realtime subscription** on `scheduled_lessons` to detect new inserts
3. The pull-to-refresh handler is missing `today-remaining-lessons` from its invalidation list

## Solution
Add a realtime listener on the `scheduled_lessons` table that automatically invalidates all schedule-related queries when a lesson is inserted, updated, or deleted.

### Step 1 — Add realtime listener in `InstructorMobileHome.tsx`
Subscribe to `postgres_changes` on `scheduled_lessons` filtered by the instructor's ID. On any change event (`INSERT`, `UPDATE`, `DELETE`), invalidate:
- `today-overview`
- `today-remaining-lessons`
- `next-lesson-details`
- `weekly-goals`
- `monthly-goals`
- `tomorrow-preview`
- `instructor-streak`

### Step 2 — Fix pull-to-refresh missing key
Add `today-remaining-lessons` to the `handleRefresh` invalidation list so manual refresh also picks up new lessons.

### Step 3 — Enable realtime for `scheduled_lessons`
Run a migration:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_lessons;
```

This ensures lessons appear immediately on the homepage and schedule after creation — no page reload or pull-to-refresh needed.

