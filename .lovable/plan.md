## Plan: Per-pupil travel-time override

Let an instructor set a travel-time value on a pupil that replaces the default `instructors.buffer_minutes` whenever that pupil sits next to another lesson in the schedule.

### 1. Database

Add a single nullable column to `pupils`:

```sql
ALTER TABLE public.pupils
  ADD COLUMN travel_time_minutes integer
  CHECK (travel_time_minutes IS NULL OR (travel_time_minutes >= 0 AND travel_time_minutes <= 240));
```

- `NULL` means "use the instructor's default buffer".
- Values clamped 0–240 minutes (4-hour ceiling — protects against fat-finger entries).
- No new RLS policies needed; existing pupil policies cover it.

### 2. UI — new "Scheduling" section on Pupil profile

File: `src/pages/PremiumPupilProfile.tsx`

- Add a new `<Section title="Scheduling">` after the existing "Safety & admin" section, on both the desktop and mobile branches that already render the section list.
- One row inside it:
  - **Label:** "Travel time to/from this pupil"
  - **Sub-label:** "Overrides your default buffer ({instructor.buffer_minutes} min) when this pupil is scheduled next to another lesson. Leave blank to use the default."
  - **Control:** number input, suffix "min", min 0 / max 240 / step 5, plus a "Clear" link button to set back to `null`.
  - **Save:** debounced autosave on blur (matches the existing pattern used elsewhere in this file for inline edits) with toast feedback `"Travel time updated"`.

Read `instructors.buffer_minutes` once via the existing instructor query for the helper text.

### 3. Apply override in scheduling logic (symmetric, both sides)

The override applies whenever a candidate slot abuts a lesson with this pupil — on either side. Effective buffer between two adjacent lessons becomes:

```
effectiveBuffer = max(
  pupilA.travel_time_minutes ?? defaultBuffer,
  pupilB.travel_time_minutes ?? defaultBuffer
)
```

(Take the larger of the two so neither pupil's requirement is violated.)

Touch points:

- **`src/hooks/useRealGapSlots.ts`** — pulls `buffer_minutes` from the instructor and computes free gaps. Extend the lessons select to include `pupils!inner(travel_time_minutes)` and use the formula above when measuring the gap before/after each lesson.
- **`src/hooks/useInstructorAvailabilitySearch.ts`** — same change on the existing-lesson loop.
- **`src/hooks/useAvailabilityData.ts`** — currently exposes `travelBufferMin` as a single number. Keep that for the global default; consumers that already have lesson-level data should call a new helper:

  ```ts
  export function effectiveBufferMinutes(
    defaultBuffer: number,
    a?: { travel_time_minutes?: number | null } | null,
    b?: { travel_time_minutes?: number | null } | null,
  ): number {
    return Math.max(
      a?.travel_time_minutes ?? defaultBuffer,
      b?.travel_time_minutes ?? defaultBuffer,
    );
  }
  ```

  Add this helper next to the existing rule logic and wire it into the gap/slot computations above.
- **Gap-fill / scheduler views** that already import `buffer_minutes` (`InstructorScheduleDesktop`, `NewMobileScheduleView`, `MultiDayScheduleView`, `RescheduleLessonSheet`, `AddLessonSheet`, `GapFillCard`) — switch their gap-validity checks to `effectiveBufferMinutes(...)` so a manual booking next to a long-travel pupil is rejected if it doesn't leave enough room.

  Per memory rule **Gap offer buffer rules**: when offering a fill-gap slot, the instructor buffer is always applied — that still holds; we're just letting the per-pupil value raise it.

- **No change to `check-travel-buffer` edge function.** It still computes real road travel time on demand for postcode pairs; the per-pupil column is a manual override that short-circuits the buffer rule, not the routing call.

### 4. Verification

- `/instructor/pupils/:id` shows the new Scheduling section with the value persisting after refresh and a working Clear link.
- Set a pupil's travel time to 30 min while default buffer is 10 min; in `/instructor/schedule`:
  - A slot 20 min after that pupil's lesson is greyed out.
  - A slot 35 min after that pupil's lesson is bookable.
  - The same enforcement applies if you try to book that pupil 20 min after another lesson.
- Setting it back to blank restores default-buffer behaviour everywhere.

### Out of scope

- Mobile layouts (per project rule).
- Auto-populating the override from the `check-travel-buffer` road-routing result (could be a future "Suggest from address" button).
- Settings UI for editing the override anywhere other than the pupil profile.