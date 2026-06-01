# Auto-Tracking Hardening Plan

Joseph Thorne's lesson exposed three gaps in the lesson telematics pipeline: open trips don't close when a lesson ends, stale trips linger forever, and instructors aren't warned when background GPS won't actually work. This plan fixes all three.

## 1. End-Lesson reconciliation

When a lesson is marked `completed` via the End-Lesson flow, automatically close any open `lesson_telematics` row for that lesson.

- New Postgres function `public.close_lesson_telematics(p_lesson_id uuid)`:
  - Finds the latest `lesson_telematics` row for the lesson where `ended_at IS NULL`.
  - Aggregates from `telematics_gps_points` (filtered to that `telematics_id`):
    - `ended_at = max(recorded_at)` (or `now()` if no points exist)
    - `total_distance_km` = sum of haversine deltas between consecutive points (>3m jitter filter, per existing GPS Route Logic memory)
    - `avg_speed_kmh` = mean of non-null `speed_kmh`
    - `max_speed_kmh` = max of `speed_kmh`
  - Writes the update in one statement.
- Trigger `trg_close_telematics_on_lesson_complete` on `scheduled_lessons` AFTER UPDATE: when `status` transitions to `completed` (and was previously not completed), call the function.
- Belt-and-braces client call: the End-Lesson submit handler also invokes the RPC after marking the lesson complete, so reconciliation runs even if the trigger is ever bypassed.

## 2. Idle-timeout sweep (pg_cron)

Catches rows the End-Lesson flow never closes (lesson left in `scheduled` or `in_progress`, app crashed, etc.).

- New edge function `reconcile-stale-telematics`:
  - Selects `lesson_telematics` rows where `ended_at IS NULL` AND the latest `telematics_gps_points.recorded_at` is older than 20 minutes AND the linked `scheduled_lessons.start_time + duration_minutes` is in the past.
  - For each row, calls `close_lesson_telematics(lesson_id)`.
  - Logs a summary count.
- pg_cron schedule: every 5 minutes, posting to the edge function with the project anon key (via `supabase--insert` so it stays out of remix migrations, per scheduled-jobs guidance).

## 3. Pre-flight GPS check on Start Lesson

Catches the actual root cause: the instructor's app wasn't running / didn't have background permission.

- New helper `src/lib/telematics/preflightGps.ts`:
  - Detects environment: Capacitor native vs. browser via `Capacitor.isNativePlatform()`.
  - **Native**: calls `Geolocation.checkPermissions()` and confirms `location === 'granted'` AND on iOS that `coarseLocation === 'granted'`. For background, checks `BackgroundGeolocation` permission state.
  - **Web**: queries `navigator.permissions.query({ name: 'geolocation' })`; flags any non-`granted` state.
- Wired into the Start-Lesson action (the same hook that opens the `lesson_telematics` row). If preflight fails:
  - Shows a blocking confirm sheet on mobile: "Background GPS isn't enabled — your lesson route won't be tracked. Open settings / Start anyway / Cancel."
  - On web (non-installed app): shows a softer warning toast: "You're not in the installed app — tracking will pause if the tab is backgrounded."
- The lesson still starts if the instructor chooses "Start anyway"; we just want them to make an informed call.

## Technical details

**Migration (function + trigger)**
```sql
CREATE OR REPLACE FUNCTION public.close_lesson_telematics(p_lesson_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_telematics_id uuid;
  v_ended timestamptz;
  v_distance numeric;
  v_avg numeric;
  v_max numeric;
BEGIN
  SELECT id INTO v_telematics_id
  FROM lesson_telematics
  WHERE lesson_id = p_lesson_id AND ended_at IS NULL
  ORDER BY started_at DESC LIMIT 1;
  IF v_telematics_id IS NULL THEN RETURN NULL; END IF;

  -- aggregates from telematics_gps_points (haversine sum with 3m jitter filter)
  WITH pts AS (
    SELECT recorded_at, speed_kmh,
           ST_MakePoint(longitude, latitude)::geography AS g
    FROM telematics_gps_points
    WHERE telematics_id = v_telematics_id
    ORDER BY recorded_at
  ), deltas AS (
    SELECT recorded_at, speed_kmh,
           ST_Distance(g, LAG(g) OVER (ORDER BY recorded_at)) AS d_m
    FROM pts
  )
  SELECT
    MAX(recorded_at),
    COALESCE(SUM(CASE WHEN d_m > 3 THEN d_m END) / 1000.0, 0),
    AVG(speed_kmh), MAX(speed_kmh)
  INTO v_ended, v_distance, v_avg, v_max FROM deltas;

  UPDATE lesson_telematics
  SET ended_at = COALESCE(v_ended, now()),
      total_distance_km = v_distance,
      avg_speed_kmh = v_avg,
      max_speed_kmh = v_max
  WHERE id = v_telematics_id;

  RETURN v_telematics_id;
END $$;

CREATE OR REPLACE FUNCTION public.trg_close_telematics_on_complete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'completed' AND COALESCE(OLD.status, '') <> 'completed' THEN
    PERFORM public.close_lesson_telematics(NEW.id);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_close_telematics_on_lesson_complete
AFTER UPDATE ON public.scheduled_lessons
FOR EACH ROW EXECUTE FUNCTION public.trg_close_telematics_on_complete();
```
(Verify the actual column names on `telematics_gps_points` — `latitude`/`longitude` vs `lat`/`lng` — and adjust before the migration runs. Drop the `ST_` calls and fall back to manual haversine if PostGIS isn't enabled.)

**Edge function `reconcile-stale-telematics`**: simple Deno function, service-role client, runs the select-then-loop described above. Scheduled via pg_cron with `supabase--insert` (not a migration).

**Files touched**
- new migration (function + trigger)
- new `supabase/functions/reconcile-stale-telematics/index.ts`
- pg_cron schedule insert
- new `src/lib/telematics/preflightGps.ts`
- edit Start-Lesson hook (likely `src/hooks/useLessonTelematics.ts` or equivalent — confirm at build time)
- edit End-Lesson submit handler (the `StepSummary` / final commit step) to call `close_lesson_telematics` RPC

## Out of scope

- Changing the live tracking polling interval, snap-to-road behaviour, or map UI.
- Any change to Geotab / OBD ingestion.
- Backfilling historical open rows (we'll only fix new ones; can revisit if you want a one-off backfill afterwards).
