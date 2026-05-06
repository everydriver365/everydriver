## Auto-track lessons & simplify tracking UI

### 1. Auto-track setting
- Add column `instructors.auto_track_lessons boolean DEFAULT true`.
- Add a toggle in Instructor Settings → Tracking section: "Automatically track scheduled lessons" (on by default). Copy: "When a lesson is due, GPS tracking starts automatically. Turn off to start tracking manually each time."

### 2. Auto-start behaviour
- On `/instructor/tracking` (and the dashboard "Today" card) check for a scheduled lesson where `now()` is within the window `start_time − 5 min` to `end_time`.
- If `auto_track_lessons = true` and no active `lesson_telematics` row exists for that lesson:
  - Request geolocation permission (browser) / background permission (native via Capacitor).
  - Start the phone GPS streamer.
  - Insert a `lesson_telematics` row tied to the lesson + pupil.
  - Show a non-blocking banner: "Auto-tracking lesson with {pupil} · Stop".
- If permission denied or `auto_track_lessons = false`, fall back to a single primary button: **"Start tracking now"** (no separate "Start phone tracking" + "Start live lesson" steps).

### 3. Collapse the two-button flow
- Remove the standalone "Start phone tracking" button. Streamer start is now implicit (auto, or via the single "Start tracking" button).
- Mode picker reduces to:
  - **Lesson** (default — picks the current/upcoming pupil automatically)
  - **Track without a pupil** (replaces "Route recorder" / "Test route"; creates a `lesson_telematics` row with `pupil_id = null`)
  - **Record driving test** (kept — has its own report flow)
- Remove "Route recorder" and "Test route" UI entries and any code paths that branched on them; migrate them to the `pupil_id IS NULL` case.

### 4. Files to touch
- DB migration: add `auto_track_lessons` column.
- `src/pages/InstructorLiveSession.tsx` (and/or `InstructorTracking` page) — auto-start hook, single button, mode list.
- Settings page (instructor settings → tracking/preferences) — new toggle wired to `instructors.auto_track_lessons`.
- Remove/retire `RouteRecorder` / "Test route" components and their routes.
- Reuse existing `MiniLiveMap`; previously-agreed removal of `PhoneLastLocationCard` still applies.

### 5. Edge cases
- Multiple back-to-back lessons: when one ends (`ended_at` set), immediately evaluate the next lesson's window and continue tracking under the new `lesson_telematics` row without stopping the streamer.
- Permission denied: show inline prompt with "Enable location" + manual "Start tracking" button; never silently fail.
- Manual stop always available; manual stop during auto-track sets a 30-min suppression so it doesn't immediately re-arm for the same lesson.
