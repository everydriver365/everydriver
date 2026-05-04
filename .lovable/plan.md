# Lesson Clash Prevention — Close Remaining Gaps

## Current state

The database is already safe. Trigger `prevent_lesson_clash` on `scheduled_lessons` uses a transaction-scoped advisory lock keyed on `(instructor_id, lesson_date)` and raises `check_violation` on overlap — so no clashing row can ever be persisted, even under concurrent inserts.

Pre-checks + friendly error mapping (`checkLessonClash` / `describeLessonClashError`) are wired into:
- `AddLessonSheet` (incl. recurring series)
- `RescheduleLessonSheet`
- `end-lesson/StepBookNext`
- `VoiceQuickAddLessonSheet`
- `course-planner/CoursePlannerForm`

So why do clashes still appear to "go through"? Two reasons in the remaining write paths:

1. They never call `checkLessonClash`, so the trigger fires and the user sees a raw Postgres error toast (or a silent failure) — easy to mistake for a successful booking.
2. A few paths swallow the error or only show `error.message` without the "That slot is already booked" mapping.

## What to change (UX/wiring only — no schema work needed)

Add a pre-check via `checkLessonClash` and map errors via `describeLessonClashError` in every remaining lesson-write path:

**Pupil-side self-booking**
- `src/components/pupil-portal/SelfBookingCalendar.tsx` (insert at lines ~136 and ~164)
- `src/components/pupil-portal/PupilPortalSchedule.tsx` (insert at ~498; updates at ~571/~581 — pass `excludeLessonId`)
- `src/components/pupil-portal/PupilPortalGaps.tsx` (insert at ~189)

**Instructor flows missing the check**
- `src/components/instructor/ScheduleLessonsDialog.tsx` (~126)
- `src/components/instructor/AddCalendarEventDialog.tsx` (~224 — only when creating a *lesson* row, not a calendar block)
- `src/components/instructor/bulk-ops/BulkRescheduleTab.tsx` (~69) — validate every lesson in the batch against the new date and abort the whole batch on any clash, listing offenders

**Admin / public booking**
- `src/components/admin/BespokeBookingModal.tsx` (~184)
- `src/components/admin/PupilRecordsManager.tsx` (insert ~205; updates ~407 and ~436)
- `src/pages/BookingConfirmation.tsx` (~176)
- `src/components/booking/LessonScheduler.tsx` (~268)

**Auto-scheduler**
- `src/utils/autoScheduler.ts` (~130) — add a final per-slot `checkLessonClash` immediately before insert and skip-with-log on clash so a long batch can't be aborted by one race; rely on the DB trigger as the ultimate guard.

## Pattern applied to each path

```ts
const clash = await checkLessonClash({
  instructorId,
  lessonDate,           // 'YYYY-MM-DD'
  startTime,            // 'HH:MM:SS'
  durationMinutes,
  excludeLessonId,      // only when updating
});
if (clash.hardOverlap) {
  toast.error(clash.message ?? 'That slot is already booked.');
  return;
}

const { error } = await supabase.from('scheduled_lessons').insert(...);
if (error) {
  const friendly = describeLessonClashError(error);
  toast.error(friendly ?? error.message);
  return;
}
```

For `BulkRescheduleTab`, run the checks in parallel first, collect offenders, and only proceed if none clash.

## Out of scope

- No schema changes. The trigger + advisory lock already guarantee atomicity.
- No changes to `calendar_events` (non-lesson blocks).
- No new libraries, no navigation changes.

## Acceptance

- Booking a slot that overlaps an existing lesson — from any portal (instructor, pupil, admin, public, auto-scheduler, bulk reschedule) — is blocked before the insert and shows "That slot is already booked."
- Concurrent attempts on the same slot: one succeeds, the other gets the friendly clash toast (DB-trigger safety net).
- Bulk reschedule aborts cleanly with a list of clashing pupils instead of partially applying.
