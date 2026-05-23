## Auto-tracking — close 3 gaps (edge functions + 1 layout mount)

No UI changes. No edits to `LiveTrackingMap.tsx`, `usePhoneTrackingStreamer.ts`, `EndLessonWizard`, or the manual flow on `InstructorLiveSession.tsx`.

---

### PART 1 — `supabase/functions/auto-start-lesson-tracker/index.ts`

Patch the `lesson_telematics` insert so routes can be linked back to the scheduled lesson.

Current insert sets: `instructor_id, pupil_id, started_at, total_distance_km, manually_started`.

Add one field:
- `lesson_id: lesson.id`

`pupil_id` already present — no change. No other edits to this function.

---

### PART 2 — `supabase/functions/auto-stop-lesson-tracker/index.ts`

After the existing `update({ ended_at })` for each session, add two blocks (both wrapped in `try/catch`; failures log + continue, never throw):

**2a — Stats backfill from points**
```ts
const { data: points } = await supabase
  .from('telematics_gps_points')
  .select('speed_kmh, latitude, longitude, recorded_at')
  .eq('telematics_id', session.id)
  .order('recorded_at', { ascending: true });

const speeds = (points ?? []).map(p => p.speed_kmh ?? 0).filter(s => s > 0);
const avgSpeed = speeds.length ? speeds.reduce((a, b) => a + b, 0) / speeds.length : null;
const maxSpeed = speeds.length ? Math.max(...speeds) : null;

await supabase
  .from('lesson_telematics')
  .update({ avg_speed_kmh: avgSpeed, max_speed_kmh: maxSpeed })
  .eq('id', session.id);
```

**2b — Idempotent `lesson_routes` write** (ports `autoCaptureLessonRoute` server-side)
- Skip silently if `points.length < 2`.
- Skip with `console.warn` if `session.lesson_id` is null (session not linked to a lesson).
- Sample to max 200 points evenly (`step = max(1, floor(len/200))`).
- `coordinates` jsonb: `{ lat, lng, speed: speed_kmh, timestamp: recorded_at }`.
- `duration_minutes`: round((last - first) / 60000).
- Pre-check: `select id from lesson_routes where telematics_id = session.id` — if exists, skip.
- Insert: `lesson_id, telematics_id, instructor_id, pupil_id, coordinates, distance_km (= session.total_distance_km), duration_minutes, started_at, ended_at`.

The session query at the top of the loop must already select `id, instructor_id, pupil_id, started_at, lesson_id, total_distance_km` — extend the existing `select(...)` accordingly. Reuse `now.toISOString()` already in scope for `ended_at`.

---

### PART 3 — Background mount of `usePhoneTrackingStreamer`

**Pre-check:** `useActiveSession(instructorId)` already exists (`src/hooks/useActiveSession.ts`) but currently filters `manually_started = true`. It cannot be reused as-is because auto-started sessions have `manually_started = false`.

**Create new hook** `src/hooks/useActiveTrackingSession.ts`:
- Query `lesson_telematics` where `instructor_id = current instructor` AND `ended_at IS NULL`, order by `started_at desc`, limit 1.
- Return `{ id, pupil_id, lesson_id } | null`.
- 10s `refetchInterval` (cron writes once/minute, so 10s catches it fast enough without hammering).
- Enabled only when an `instructorId` is provided.

**Mount in `src/components/layout/InstructorPortalLayout.tsx`** (the persistent wrapper for `/instructor/*`):
- Pull current `instructorId` via the existing instructor-profile hook used elsewhere in that file.
- Read `instructors.auto_start_tracker` (single column query, cached via React Query). If `false` or unknown → render children only, **do not call the streamer hook at all** (gates GPS permission prompt).
- If `true`: call `useActiveTrackingSession`, then:
  ```ts
  usePhoneTrackingStreamer({
    provider: activeSession ? "phone" : null,
    pupilId: activeSession?.pupil_id ?? null,
    sessionId: activeSession?.id ?? null,
    minIntervalMs: 3000,
  });
  ```
  No `onPosition` callback — background writes only.
- When no active session, `provider: null` makes the hook a no-op (matches its existing early-return).

This means: instructor opens app → if toggle on, layout polls for active session → cron creates session at lesson start → next poll picks it up → phone GPS streams points → cron stops session at lesson end → stop function writes `lesson_routes` → pupil portal `PupilRouteHistory` displays it.

---

### PART 4 — Verification

- Read both edge function files post-edit, confirm patches present and other logic untouched.
- Deploy `auto-start-lesson-tracker` and `auto-stop-lesson-tracker`.
- Confirm `InstructorPortalLayout.tsx` only adds: 2 hook imports, 1 toggle query, conditional `useActiveTrackingSession` + `usePhoneTrackingStreamer` call. No JSX changes.
- Confirm no edits to `LiveTrackingMap.tsx`, `usePhoneTrackingStreamer.ts`, `useActiveSession.ts`, `EndLessonWizard.tsx`, `InstructorLiveSession.tsx`.

### PART 5 — Deferred (not in this pass)

- Damoov scoring backfill on auto-stop.
- Auto-attaching the session to a `gps_devices` row when none is free (current behavior: phone streamer writes points directly via `record_phone_gps_point`, which doesn't require a device row — works without this).
- Any UI affordance to show "auto-tracking active" status.
- Mileage trigger validation (`auto_log_mileage` already fires on `ended_at`).