
## Goal
1. Rename the "Tracker" pill on the Next Lesson tile to "Start Track".
2. When pressed, navigate to the tracking page AND auto-start the recording session at the lesson's scheduled start time (immediately if the lesson has already started, otherwise schedule the start).
3. Add an instructor setting "Auto-start tracker for every lesson" — when enabled, the system automatically begins a tracking session at each lesson's start time without any tap.

## Investigation summary
- `NextUpTile.tsx` already has the amber pill — just rename label and adjust deep-link to include an `autoStart=1` flag.
- `InstructorLiveSession.tsx` already auto-selects pupil from `?pupilId=`. Need to extend it to also call the existing "start session" handler when `autoStart=1` and the lesson time has arrived (or wait until it does).
- Auto-start everywhere needs a background mechanism. Hardware trackers (Radius/Geotab) auto-record per memory, so "starting a session" really means creating a `lesson_telematics` row tied to the lesson + pupil so route/alerts get linked. This is best done server-side via cron so it runs whether the instructor has the app open or not.

## Plan

### 1. UI — rename + deep-link (small)
- `NextUpTile.tsx`: change label "Tracker" → "Start Track".
- Link target: `/instructor/tracking?pupilId={pupilId}&lessonId={lessonId}&autoStart=1`.
- `ExpandableLessonCard.tsx`: same rename + add `&autoStart=1` to the existing button.

### 2. Tracking page — honour `autoStart`
- `InstructorLiveSession.tsx`: when `autoStart=1`, after pupil is selected:
  - If lesson `start_time` is in the past or within 1 min → call existing "start session" handler immediately.
  - If still in the future → show a small countdown banner "Auto-starting in X:XX" and trigger when reached.
- Strip `autoStart` from URL after firing so a refresh doesn't re-trigger.

### 3. New instructor setting — Auto-start every lesson
- DB: add `auto_start_tracker boolean DEFAULT false` to `instructors` table (migration).
- UI: add a toggle in `InstructorSettings` under a "Tracking" section:
  - Label: "Auto-start tracker for every lesson"
  - Description: "Automatically begins a tracking session at the start of every lesson, no tap required."

### 4. Backend auto-start (when toggle ON)
- New edge function `auto-start-lesson-tracker`:
  - Runs every minute via `pg_cron`.
  - Finds lessons where: `start_time` is within the last 2 min, instructor has `auto_start_tracker = true`, and no `lesson_telematics` row exists yet for that lesson.
  - Creates a `lesson_telematics` row (`instructor_id`, `pupil_id`, `started_at = now()`, `lesson_id`) so hardware GPS points get attached to that session.
  - (Optional) Sends a quiet push/notification "Tracking started for {pupil}" — skip unless requested.

### 5. Files
- EDIT `src/components/instructor/NextUpTile.tsx` — rename + autoStart param.
- EDIT `src/components/instructor/ExpandableLessonCard.tsx` — rename + autoStart param.
- EDIT `src/pages/InstructorLiveSession.tsx` — read `autoStart`, fire/scheduled start.
- EDIT `src/pages/InstructorSettings.tsx` (or relevant settings sub-page) — add toggle.
- NEW migration — add `auto_start_tracker` column.
- NEW edge function `supabase/functions/auto-start-lesson-tracker/index.ts`.
- NEW pg_cron schedule (1-minute cadence) using the supabase insert tool (per cron-job rule).

## Open question
None critical — proceeding with: deep-link auto-starts immediately if past start time, otherwise schedules; backend cron handles the toggle path.
