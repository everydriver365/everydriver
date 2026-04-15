

## Link Fleet Map from Tracker + Back Button + Colleague Mode

### What changes

1. **Fleet Map back button** — Add a back/close button (top-left, behind the stats bar) to navigate back to the previous page (`navigate(-1)`).

2. **Fleet Map link on tracking page** — Add a "Fleet Map" button/card on `InstructorLiveSession.tsx` (the no-session view, after the MiniLiveMap), linking to `/instructor/fleet-map`.

3. **Colleague mode on Fleet Map** — Accept an optional `?mode=colleagues` query param. When present:
   - Look up the current instructor's school(s) via `school_instructors`
   - Fetch all `instructor_id`s in those schools
   - Query `gps_devices` with `.in("instructor_id", colleagueIds)` instead of `.eq("instructor_id", instructorId)`
   - Add `instructor_id` to the `FleetDevice` interface and show instructor name in popups

4. **"Find My Colleague" tile** — Rename or add a tile that navigates to `/instructor/fleet-map?mode=colleagues`. Update in:
   - `AppStyleHomeView.tsx`
   - `DashboardLayoutManager.tsx`
   - `SwipeableQuickAccess.tsx`

### Technical details

**File: `src/pages/InstructorFleetMap.tsx`**
- Add `useSearchParams` to detect `mode=colleagues`
- Add `ArrowLeft` icon import + back button in the top-left controls
- New `useEffect` for colleague mode:
  ```typescript
  // 1. Get my schools
  const { data: mySchools } = await supabase
    .from("school_instructors")
    .select("school_id")
    .eq("instructor_id", instructorId);
  
  // 2. Get all instructor IDs in those schools
  const schoolIds = mySchools.map(s => s.school_id);
  const { data: members } = await supabase
    .from("school_instructors")
    .select("instructor_id")
    .in("school_id", schoolIds);
  
  // 3. Fetch their devices
  const ids = [...new Set(members.map(m => m.instructor_id))];
  const { data } = await supabase
    .from("gps_devices")
    .select("id, device_name, device_identifier, instructor_id, ...")
    .in("instructor_id", ids)
    .eq("tracking_provider", "radius");
  ```
- Join instructor name for popup display: fetch instructors table for the colleague IDs and map names onto devices

**File: `src/pages/InstructorLiveSession.tsx`**
- After `MiniLiveMap` (line ~958), add a card/button linking to `/instructor/fleet-map`:
  ```
  <Link to="/instructor/fleet-map">
    Fleet Map → View all vehicles
  </Link>
  ```

**Files: `AppStyleHomeView.tsx`, `DashboardLayoutManager.tsx`, `SwipeableQuickAccess.tsx`**
- Add a "Find Colleague" tile with route `/instructor/fleet-map?mode=colleagues`, using `UsersRound` icon

### No database changes needed
The existing `gps_devices` and `school_instructors` tables have all required data. RLS on `gps_devices` may need a policy allowing reads for same-school instructors — will verify and add a migration if needed.

