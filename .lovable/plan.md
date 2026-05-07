## Goal

When adding a lesson, block, or event from the instructor app, if there's a clash with an existing booking, surface a clear warning and let the instructor tick **"Book anyway (override clash)"** to force-save. Today the DB trigger `prevent_lesson_clash` always blocks hard overlaps, so even the existing "Book anyway" checkbox in `AddLessonSheet` only works for buffer warnings — true overlaps still fail.

## Changes

### 1. Database — let the trigger respect an override flag

Add a nullable `clash_overridden boolean` column to `scheduled_lessons` (default `false`) and update `public.prevent_lesson_clash()` so that:

```sql
IF COALESCE(NEW.clash_overridden, false) THEN
  RETURN NEW; -- instructor explicitly chose to double-book
END IF;
```

This is the only way to bypass the existing 23514 check from the client. We keep the trigger active for all the other (non-overridden) writes so accidental clashes are still blocked.

### 2. `AddLessonSheet.tsx` (mobile add-lesson)

- The component already has `overrideBuffer` state and a "Book anyway (override buffer)" checkbox shown only when the warning is buffer-only. Repurpose it so it's also shown when `isHardOverlap` is true (label changes to **"Book anyway (override clash)"**).
- In `handleAddLessonExisting` / `handleAddLessonNew` / the recurring weeks loop:
  - If `conflictWarning` and `overrideBuffer` is checked, proceed.
  - Pass `clash_overridden: true` on every inserted row in the lessons array.
- Strip the existing early-return `if (isHardOverlap) { toast.error... }` so the override actually wins.

### 3. `AddCalendarEventDialog.tsx` (lesson + block + event tabs)

- **Lesson tab** (`handleAddLesson`): instead of returning when `clash.hardOverlap`, render a small inline warning + a "Book anyway (override clash)" checkbox (new state `overrideClash`). When checked, insert with `clash_overridden: true`; otherwise keep blocking.
- **Block / Event tabs** (`handleAddBlock`, `handleAddEvent`): currently no clash check at all. Add a pre-save call to `checkLessonClash` against the chosen instructor/date/time window. If a clash exists, show the same inline warning + override checkbox. Blocks/events live in `instructor_manual_blocks`, which has no DB trigger, so no schema change is needed for them — the override simply suppresses the UI block.
- Reset the override state in `resetForm()` and whenever the date/time/duration changes (so users can't accidentally carry it over).

### 4. `RescheduleLessonSheet.tsx` and `EditScheduleEntryDialog.tsx`

Out of scope for this request (user said *adding* a lesson or event). Leave untouched; we can extend later if needed.

## Technical notes

- `checkLessonClash` already returns the conflicting slot names — reuse `clash.message` for the warning text in `AddCalendarEventDialog`.
- The block/event clash check should also flag overlaps with existing `instructor_manual_blocks` rows for the same instructor/day. `checkLessonClash` only queries `scheduled_lessons` + `instructor_calendar_events`. Extend it (or add a thin sibling helper used by the dialog) to also fetch `instructor_manual_blocks` for the day and treat them as `kind: 'block'` slots.
- Default `clash_overridden = false` keeps every existing insert path safe; the trigger only steps aside when the client explicitly opts in.
- No analytics, no toasts changes beyond the wording. UK + DSM portal styling stays as-is (rounded-2xl warning card matches the existing buffer warning).

## Out of scope

- Changing reschedule/edit flows.
- Pupil-facing self-booking (still hard-blocks).
- Showing override audit history in the UI.
