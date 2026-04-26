## Problem

When booking a new lesson via `AddLessonSheet`, the conflict check only flags **hard time overlaps** with existing lessons. It ignores:

1. The instructor's configured **`buffer_minutes`** (breathing room between lessons) — even though `RescheduleLessonSheet`, `MultiDayScheduleView` and `GapFillCard` all honor it.
2. **Travel time** between the previous/next lesson's location and the new pickup — currently only shown as a soft "tap to apply" suggestion based on the *previous* lesson, never the *next* one, and never blocks save.

Result: instructors can book lessons back-to-back with zero gap, or with insufficient time to drive between pickups.

## Fix

Update `src/components/instructor/AddLessonSheet.tsx` so the conflict + travel logic matches the rest of the app:

### 1. Load instructor buffer once
On sheet open, fetch `instructors.buffer_minutes` for the current `instructorId` and keep in state (default 0 if null). Same pattern as `RescheduleLessonSheet`.

### 2. Apply buffer to the overlap check
In the existing lessons loop, treat each existing lesson as occupying:
```
[existingStart - bufferMinutes,  existingEnd + bufferMinutes]
```
Flag a conflict when the new lesson `[newStart, newEnd]` intersects that buffered window. Message: `"Too close to {names} (needs {buffer} min buffer)"`.

### 3. Resolve travel time on **both sides** (previous and next lesson)
Currently only the previous lesson is checked. Extend to also find the lesson that starts soonest *after* the new lesson and call `check-travel-buffer` for `newPickup → nextPickup`.

Effective rules (mirrors `mem://features/instructor/gap-offer-buffer-rules`):
- `requiredGapBefore = bufferMinutes + travelInMinutes`
- `requiredGapAfter  = bufferMinutes + travelOutMinutes`
- If `(newStart - prevEnd) < requiredGapBefore` → conflict (with suggested time, like today).
- If `(nextStart - newEnd) < requiredGapAfter` → conflict (suggest moving the new lesson earlier or shortening duration).

### 4. Block save when buffer/travel is violated
The existing `handleAddLessonExisting` / `handleAddLessonNew` handlers already abort on `conflictWarning`. Because rules 2 + 3 now feed into `conflictWarning`, save will be blocked until the instructor either:
- adjusts the start time (the suggestion chip stays available for one-tap fix), or
- explicitly accepts the warning via a new "Book anyway" override link inside the warning banner (writes `override_buffer = true` to the booking note for audit, no DB schema change needed).

### 5. First-lesson-of-day travel allowance
If there is no previous lesson on that date, fall back to the existing first-lesson logic already used elsewhere (home postcode → pickup via `check-travel-buffer`) so the first slot of the day still warns when there isn't enough time to drive from home.

## Files touched

- `src/components/instructor/AddLessonSheet.tsx` — load `buffer_minutes`, expand conflict check, add next-lesson travel check, "Book anyway" override.

No DB migrations, no edge function changes (reuses `check-travel-buffer`).

## Out of scope

- Reschedule sheet (already correct).
- Gap-fill / scheduler flows (already correct).
- Changing buffer defaults or adding per-pupil overrides.