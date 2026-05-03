## Goal
Make it impossible to create overlapping lessons for the same instructor — at the UI, the booking flows, and the database.

## 1. Shared clash-check helper
Create `src/lib/lessonClashCheck.ts`:

- `checkLessonClash({ instructorId, date, startTime, durationMinutes, bufferMinutes = 0, excludeLessonId? })`
- Queries `scheduled_lessons` for that instructor + date (excluding `cancelled` and `excludeLessonId`)
- Queries `instructor_calendar_events` busy events for that day (reuse all-day/holiday rules from `AddLessonSheet`)
- Returns `{ hardOverlap: boolean, bufferOnly: boolean, clashes: Array<{ name, startTime, endTime, kind: 'lesson' | 'event' }> }`

Refactor `AddLessonSheet` and `RescheduleLessonSheet` to call this helper instead of duplicating logic.

## 2. Wire helper into unguarded booking paths
- **`VoiceQuickAddLessonSheet`** — call helper before insert. Hard overlap → toast error + abort. Buffer-only → confirm dialog ("Book anyway?").
- **`CoursePlannerForm`** — run helper for every generated lesson before bulk insert. If any clash, show a summary list and require user to resolve (reduce hours / change preferences) before allowing insert.
- **`LessonScheduler`** (pupil-facing booking) — extend the existing `conflictsWithExternalEvents` check to also fetch existing `scheduled_lessons` for the instructor on each candidate date, so manually-added lessons block pupil bookings too.

## 3. Tighten override behaviour
In `AddLessonSheet`, `overrideBuffer` currently lets a user save through a true overlap as well. Change so:
- Override bypasses *buffer-only* warnings only
- True hard overlaps always block Save (no override path)

## 4. Database safety net (migration)
Add a `BEFORE INSERT OR UPDATE` trigger `prevent_lesson_clash` on `public.scheduled_lessons`:

- Computes new lesson's `[start, start + duration_minutes)` window
- Raises exception if any other non-cancelled lesson for the same `instructor_id` on the same `lesson_date` overlaps that window (excluding the row being updated)
- Hard-overlap only (no buffer) — buffer remains a UI concern

Plus a supporting index: `(instructor_id, lesson_date) WHERE status <> 'cancelled'`.

This catches:
- Race conditions (two simultaneous saves)
- Any future code path that forgets the client check
- Edge function / direct DB inserts

## Files touched
- new `src/lib/lessonClashCheck.ts`
- `src/components/instructor/AddLessonSheet.tsx` (refactor + override fix)
- `src/components/instructor/RescheduleLessonSheet.tsx` (refactor)
- `src/components/instructor/VoiceQuickAddLessonSheet.tsx` (add check)
- `src/components/course-planner/CoursePlannerForm.tsx` (add check + summary UI)
- `src/components/booking/LessonScheduler.tsx` (also query scheduled_lessons)
- new migration: trigger + index

## Out of scope
- Changing buffer logic / values
- Mobile layout changes
- Calendar event clash rules (kept as-is)
