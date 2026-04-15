

# Add Lesson Status Indicators to Today's Schedule

## What changes

The Today's Schedule agenda will visually distinguish three states for each lesson:

1. **Completed (wizard done)** — status is `completed`. Green checkmark, faded row, strikethrough name (already partially done, will enhance).
2. **Next up** — the first non-completed lesson. Highlighted with a subtle blue left border and "NEXT" badge.
3. **Upcoming** — remaining scheduled lessons. Normal styling (as-is).

For the end-of-lesson routine indicator, since the `EndLessonWizard` sets `status = "completed"` when it finishes, any lesson that has passed its end time but is still `scheduled` (not `completed`) means the wizard hasn't been run yet. We'll show a small orange "End lesson" nudge on these overdue-but-not-completed lessons.

## Technical details

### File: `src/components/instructor/TodayScheduleAgenda.tsx`

**Determine lesson states** using current time:
```
const now = current HH:mm
const endTime = startTime + durationMinutes

- status === "completed" → DONE (wizard completed)
- endTime <= now && status !== "completed" → OVERDUE (wizard not done)
- first lesson where status !== "completed" && endTime > now → NEXT
- everything else → UPCOMING
```

**Visual indicators:**
- **DONE**: Green check icon, 55% opacity, strikethrough name (existing), add small "✓ Done" green text
- **OVERDUE (wizard pending)**: Orange clock icon + "End lesson" text, normal opacity to draw attention
- **NEXT**: Blue left accent border (4px), subtle blue background tint, "Next" badge
- **UPCOMING**: No change (current default styling)

### File: `src/hooks/useTodayRemainingLessons.ts`

No changes needed — `status` field is already included in the query and interface.

### File: `src/components/instructor/TodayMiniTimeline.tsx`

Add the same visual state logic (completed check, next highlight, overdue nudge) to the card-based timeline view for consistency.

## Summary of changes
1. `TodayScheduleAgenda.tsx` — Add state detection logic and visual indicators for done/next/overdue
2. `TodayMiniTimeline.tsx` — Mirror the same status indicators on timeline cards

