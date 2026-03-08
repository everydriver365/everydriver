

## How MyDriveTime's Journey Tracking Works vs Your App

### MyDriveTime's Approach
MyDriveTime's "Journey Tracking" is a **phone GPS recorder** built into their lesson flow:
1. Instructor taps "Start Lesson" on the diary entry
2. App begins recording phone GPS coordinates in the background
3. When lesson ends, the route is saved and displayed on a map
4. Students and parents can view routes in the pupil app — showing progression from quiet estates to dual carriageways over time
5. It's a simple breadcrumb trail — no speed analysis, no telemetry, no hardware needed

### What You Currently Have
- **`lesson_routes` table** exists in the DB (coordinates JSONB, distance_km, duration_minutes)
- **`LessonRouteViewer`** displays saved routes on a Leaflet map with start/end markers
- **No recorder** — there is no component or hook to actually capture GPS during a lesson
- **Geotab telemetry** records GPS points with speed, speed limits, road names — but it's separate from lesson_routes and requires hardware

### The Gap
You have the **viewer** but not the **recorder**. You also have a much more powerful GPS system (Geotab) that already records everything — but it's not linked to individual lesson routes.

---

## Plan: Build Lesson Route Recording

Two approaches combined for maximum coverage:

### 1. Auto-Link Geotab Trips to Lessons (Zero effort for instructor)
When a lesson starts/ends (from the diary), automatically match the Geotab GPS points from that time window and save them as a `lesson_route`. No button pressing needed.

- Create a `useLessonRouteAutoCapture` hook that runs when a scheduled lesson's status changes to "in_progress" or "completed"
- Query `telematics_gps_points` for the instructor's active device during the lesson time window
- Save matched points to `lesson_routes` with the `pupil_id` and `lesson_id`

### 2. Phone GPS Fallback Recorder (For instructors without Geotab)
A simple "Record Route" button on the lesson view that uses the browser Geolocation API — matching MyDriveTime's approach.

- **New component**: `LessonRouteRecorder.tsx` — Start/Stop recording button
- Uses `navigator.geolocation.watchPosition()` to collect coordinates every 5 seconds
- Calculates distance via haversine (already have `haversineKm` in `useInterpolatedPosition.ts`)
- On stop, saves to `lesson_routes` table
- Works offline using existing `useOfflineGPSQueue` pattern for IndexedDB buffering

### 3. Pupil & Parent Portal Route View
- Add route history to the pupil portal (like MyDriveTime shows students where they've been)
- Show progression over time: "Lesson 1: residential streets" → "Lesson 15: dual carriageways"
- Parents can see routes too

### 4. Link lesson_routes to scheduled_lessons
- Add `lesson_id` column to `lesson_routes` table (currently missing)
- This connects routes to specific diary entries

---

### Technical Steps

| Step | What |
|------|------|
| Migration | Add `lesson_id` column to `lesson_routes`, add `instructor_id` column |
| `LessonRouteRecorder.tsx` | Phone GPS recorder with Start/Stop, uses Geolocation API |
| `useLessonRouteAutoCapture.ts` | Hook to auto-extract Geotab GPS points for a lesson time window |
| Update `LessonRouteViewer` | Add speed-colored route segments (reuse TripReplayMap pattern) |
| Pupil portal | Add lesson route history view to BrandedPupilPortal |
| Parent portal | Show child's lesson routes |

This gives you **better than MyDriveTime** — they only have phone GPS with a basic map. You'll have Geotab auto-capture (no button needed) plus phone fallback, speed-colored routes, and road names.

