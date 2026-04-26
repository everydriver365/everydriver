## Goal

Show a small "Imported from Google" badge on instructor lesson cards when the lesson was synced in from Google Calendar. The badge has a tooltip that reveals the underlying `google_event_id` so support / instructors can match it back to the source event.

## Where it appears

1. **Mobile homepage — `TodayLessonsList.tsx`** (the timeline cards on the instructor mobile home).
2. **Desktop / detail — `ExpandableLessonCard.tsx`** — replace the current "Synced / Not synced" row with the same badge style for consistency, plus tooltip.

Any lesson where `scheduled_lessons.google_event_id IS NOT NULL` qualifies.

## Visual design

- Small pill, height matching existing badges (~18–20 px).
- Light blue tint (`bg-sky-500/10 text-sky-600`) with the Google "G" or `Calendar` icon (4-color G if simple, otherwise lucide `Calendar` icon — to avoid adding an SVG asset, use lucide `Calendar` at 10 px).
- Label: "Google" (full label "Imported from Google" lives in the tooltip to keep the pill compact on mobile).
- Tooltip content (shadcn `Tooltip`):
  - Line 1: "Imported from Google Calendar"
  - Line 2: monospace `Event ID: {google_event_id}`
  - Tap-and-hold on touch devices opens the same tooltip (shadcn handles this).

## Data plumbing

- Extend `useTodayRemainingLessons` hook to select and return `google_event_id` as `googleEventId: string | null` on the `TodayLesson` type.
- `ExpandableLessonCard` already receives `lesson.google_event_id` — no data change needed there.

## Placement on the mobile card

Slot the new badge into the top row, immediately to the left of the existing lesson-type / "Done" badge, so the row reads: avatar · name · [Google] · [Type/Done].
On very narrow widths the lesson-type badge already truncates gracefully; the Google badge shows just the icon when truncation is needed.

## Out of scope

- No change to the import / sync flow itself.
- No change to filtering rules around what gets imported.
- No badge added to read-only calendar event tiles (those are already obviously calendar items).
