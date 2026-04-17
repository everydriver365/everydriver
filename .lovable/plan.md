

The user wants automatic mileage logging per pupil based on the Radius hardware tracker, tied to lesson times.

Existing pieces I can use:
- `auto-start-lesson-tracker` edge function already creates a `lesson_telematics` session at lesson start time (when instructor has `auto_start_tracker` on) and attaches it to the active GPS device.
- `radius-poller` writes GPS points and accumulates `total_distance_km` on the session.
- `auto_log_mileage` trigger already writes a `mileage_logs` row when a session ends with distance > 0.1km, marking it `business` and linking the pupil — exactly what's needed.
- Memory confirms Radius is the active hardware provider.

What's missing:
1. No auto-stop. `auto-start-lesson-tracker` opens the session at lesson start, but nothing closes it at lesson end. Without `ended_at`, the `auto_log_mileage` trigger never fires, so no mileage row is created per pupil.
2. The auto-log trigger exists as a function but no DB trigger is currently attached (the schema dump shows "no triggers"). Needs to be wired up.
3. Settings UI toggle for instructors to opt in (`auto_start_tracker` already exists in the `instructors` table — verify a UI toggle exists in settings).

## Plan

**1. New edge function: `auto-stop-lesson-tracker`**
Runs every minute via pg_cron. Finds open `lesson_telematics` sessions whose linked lesson has ended (lesson `end_time` passed by ≥1 min), sets `ended_at = now()`, clears the GPS device's `current_session_id` / `current_pupil_id`. To match session→lesson, look up the most recent lesson for that instructor+pupil today whose end_time has just passed.

**2. Re-attach the `auto_log_mileage` trigger**
Add a DB trigger on `lesson_telematics` AFTER UPDATE so when `ended_at` flips from NULL → value, a `mileage_logs` row is auto-created with pupil_id, distance, lesson_date, trip_type='business', purpose='Driving lesson', is_auto_logged=true. The function already exists; just needs the trigger.

**3. pg_cron schedule**
Add a cron job that calls `auto-stop-lesson-tracker` every minute (mirroring how `auto-start-lesson-tracker` is invoked).

**4. Settings toggle**
Confirm/add a toggle in instructor settings: "Auto-track lesson mileage (Radius)" that flips `instructors.auto_start_tracker`. If missing, add it under the Telematics/Tracking section in `InstructorMenu` settings.

## Outcome

Once enabled, every booked lesson with a pupil will:
- Auto-open a Radius tracking session at lesson start
- Accumulate live GPS distance during the lesson
- Auto-close at lesson end
- Auto-write a per-pupil `mileage_logs` row (business mileage, HMRC-ready)

No manual start/stop required. Mileage shows up in the existing Mileage Tracking screen attributed to the correct pupil and lesson.

