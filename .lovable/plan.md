## Problem

When adding a lesson from the home schedule's "Add lesson" button, two identical rows are being inserted into `scheduled_lessons` ~1 ms apart (confirmed in the database — e.g. two rows at 12:17:08.428 and 12:17:08.429 for the same pupil/date/time).

The save button uses React state (`loading`) to disable itself, but `setLoading(true)` is asynchronous. A fast double-tap (common on iOS) fires the handler twice before React re-renders the disabled button, so two inserts go through.

There are no DB triggers duplicating rows, and only one `AddLessonSheet` is mounted on the home screen — this is purely a client-side double-submit race.

## Fix

In `src/components/instructor/AddLessonSheet.tsx`:

1. Add a `useRef` flag (`submittingRef`) that flips synchronously on entry to either save handler and resets in the `finally` block.
2. At the top of `handleAddLessonExisting` and `handleAddLessonNew`, return immediately if `submittingRef.current` is already `true`.
3. Reset `submittingRef.current = false` in `finally` (alongside `setLoading(false)`), and also reset it inside `resetForm` / when the sheet closes, so reopening works cleanly.

This blocks the second invocation immediately, regardless of React render timing.

### Technical detail

```text
const submittingRef = useRef(false);

const handleAddLessonExisting = async () => {
  if (submittingRef.current) return;   // sync guard
  submittingRef.current = true;
  setLoading(true);
  try { ...existing logic, single insert... }
  finally {
    setLoading(false);
    submittingRef.current = false;
  }
};
```

Same change applied to `handleAddLessonNew`.

## Out of scope

No DB-level unique constraint is added (would require deciding on the natural key and handling legitimate edits). The client guard is sufficient for this UX bug; we can revisit a DB constraint separately if duplicates ever appear from another entry point.

## Files touched

- `src/components/instructor/AddLessonSheet.tsx` — add ref guard to both save handlers.
