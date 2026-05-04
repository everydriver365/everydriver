## Why clashes are slipping through

There is a clash helper (`src/lib/lessonClashCheck.ts`) but **most write paths either skip it or only use it for a UI warning**. The database has no exclusion constraint either, so the final `INSERT`/`UPDATE` is unguarded.

Audit of every place that writes to `scheduled_lessons`:

| File | What it does | Clash check today |
|---|---|---|
| `components/instructor/AddLessonSheet.tsx` (existing + new pupil, recurring) | Manual add | Live UI banner only. `handleAddLessonExisting` / `handleAddLessonNew` block on the in-memory `conflictWarning` flag, but that flag depends on `pendingCheckRef` resolving and only covers the **first** lesson — recurring weeks 2..N are inserted with no check |
| `components/instructor/RescheduleLessonSheet.tsx` | Move a lesson | Filters slot picker, but `handleReschedule` does **no** final check — clicking an unfiltered time or a stale slot writes through |
| `components/instructor/end-lesson/StepBookNext.tsx` | "Book next" suggestion | `isAvailable` used while building suggestions; `handleBook` inserts with **no** re-check |
| `components/instructor/VoiceQuickAddLessonSheet.tsx` | Voice add | Uses `checkLessonClash` and blocks on `hardOverlap` ✅ |
| `components/course-planner/CoursePlannerForm.tsx` | Course planner bulk insert | Uses `checkLessonClash` and blocks on `hardOverlap` ✅ |
| `components/instructor/MultiDayScheduleView.tsx` (no-show only writes here) | Status update | N/A |
| `utils/autoScheduler.ts` → callers (`InstructorPendingScheduling`, etc.) | Auto schedule | Uses internal `blockedSlots` for selection, but does **not** re-check at insert time, so two parallel auto-schedule runs or stale data can collide |

Also: `lessonClashCheck` itself doesn't exclude `deleted_at IS NOT NULL` from `instructor_calendar_events` (only on lessons), and the `excludeLessonId` option exists but isn't passed by `RescheduleLessonSheet`.

## Plan

### 1. Make `checkLessonClash` the single gate before every write

Wire the existing helper into the three unguarded paths so the insert/update only runs after `hardOverlap === false` (and after explicit user override of buffer-only warnings).

- **`AddLessonSheet.tsx`** — replace the `conflictWarning` short-circuit in `handleAddLessonExisting` and `handleAddLessonNew` with an authoritative `await checkLessonClash(...)` call. Run the check **for every recurring date**, not just the first. If any week clashes, abort the whole batch (recurring lessons should be all-or-nothing) and surface which date clashed in the toast.
- **`RescheduleLessonSheet.tsx`** — call `checkLessonClash({ instructorId, date: selectedDate, startTime: selectedTime, durationMinutes, bufferMinutes, excludeLessonId: lessonId })` in `handleReschedule` before the update; block on `hardOverlap`, prompt confirm on `bufferOnly`.
- **`StepBookNext.tsx`** — call `checkLessonClash` inside `handleBook` immediately before the insert; if it clashes, refresh suggestions and toast "That slot was just taken — pick another".

### 2. Tighten `lessonClashCheck.ts`

- Add `.is('deleted_at', null)` to the `instructor_calendar_events` query (matches the lessons query).
- Make `bufferMinutes` default to the instructor's saved buffer when the caller passes `undefined` (currently silently 0).
- Return the clashing lesson IDs in `ClashResult.clashes` so callers can link straight to the conflict.

### 3. Database safety net

Add a migration that prevents two non-cancelled, non-deleted lessons for the same instructor from overlapping, regardless of which client wrote them:

```text
EXCLUDE USING gist (
  instructor_id WITH =,
  tstzrange(
    (lesson_date + start_time)::timestamptz,
    (lesson_date + start_time + (duration_minutes || ' minutes')::interval)::timestamptz
  ) WITH &&
) WHERE (status <> 'cancelled' AND deleted_at IS NULL)
```

Requires enabling the `btree_gist` extension. This is the only guarantee that races / future code paths can't reintroduce the bug. Surface the Postgres error code (`23P01`) as a friendly "That slot is already booked" toast in the three sheets above.

### 4. Auto-scheduler hardening

In `utils/autoScheduler.ts` callers, after `findOptimalSlots` returns, run `checkLessonClash` per slot just before insertion (the slot list can be stale by seconds). Skip + log any that now collide rather than aborting the whole run.

### 5. Tests

Add focused vitest cases mirroring the existing `gapFeasibility.test.ts` style:
- `lessonClashCheck` returns `hardOverlap` for exact, partial, and contained overlaps; `bufferOnly` only inside the buffer window; ignores cancelled + soft-deleted; honours `excludeLessonId`; ignores non-blocking all-day calendar events.
- `AddLessonSheet` recurring path aborts when week 3 clashes.

## Files to change

- `src/lib/lessonClashCheck.ts` (deleted_at filter, default buffer, return ids)
- `src/components/instructor/AddLessonSheet.tsx` (gate + per-week recurring check)
- `src/components/instructor/RescheduleLessonSheet.tsx` (gate + excludeLessonId)
- `src/components/instructor/end-lesson/StepBookNext.tsx` (gate before insert)
- `src/utils/autoScheduler.ts` callers (re-check at insert time)
- New migration: enable `btree_gist`, add exclusion constraint on `scheduled_lessons`
- New tests under `src/lib/__tests__/lessonClashCheck.test.ts`

## Out of scope

- Visual changes to any sheet (warnings already styled).
- Changing how buffer minutes are configured.
- Pupil-side public booking on `PublicAvailability` / `BookingConfirmation` — these go through different validators; happy to add to a follow-up if you've seen clashes coming from the pupil flow specifically.