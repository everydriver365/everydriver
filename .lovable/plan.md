
The user wants the "Open Tracker" reminder integrated into the Next Lesson tile (not a separate banner) and the action should actually do something useful.

Looking at context: hardware tracker auto-records, so "Open Tracker" as an app launcher is meaningless. The most useful action is to navigate to `/instructor/tracking` (the live tracking map) so the instructor can confirm the vehicle/tracker is online before the lesson starts.

## Plan

**1. Remove the standalone `TrackerReminderBanner`** from wherever it's rendered on the home page (likely `Instructor.tsx` or a home component).

**2. Add a tracker indicator to the Next Lesson tile**
Find the Next Lesson tile component (uses `useNextLessonDetails`). When `minutesUntil <= 30` (configurable threshold), show:
- A small amber pill/marker on the tile: phone icon + "Tracker ready" or "Check tracker"
- Tapping the tile (or the marker) navigates to `/instructor/tracking?lessonId={id}` so the instructor lands on the live map and can verify the hardware tracker is reporting

**3. Make the marker actionable**
- Marker is a tappable chip with `onClick` that calls `navigate('/instructor/tracking')`
- Stops event propagation so it doesn't conflict with the tile's main tap target (which goes to pupil details)
- Persists dismissal logic (per-lesson, daily reset) preserved from the old banner so instructors can hide it once acknowledged

**4. Files**
- EDIT the Next Lesson tile component (need to locate — likely `NextLessonCard.tsx` or similar in `src/components/instructor/`)
- EDIT wherever `TrackerReminderBanner` is rendered — remove it
- DELETE or leave `TrackerReminderBanner.tsx` unused (keep file, just stop rendering)

## UX
- Marker only appears when a lesson is ≤30 min away
- Amber dot + "Tracker" label, top-right of tile
- Tap → live tracking map; long-press / X to dismiss for that lesson
