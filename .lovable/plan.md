
# Fix: Recent Trips "Failed to load trip data"

## Problem

The Recent Trips list navigates to `/instructor/trip-replay/{lesson_telematics_id}`. The trip replay page extracts this as `routeId` and queries the `saved_routes` table with it. Since the ID belongs to `lesson_telematics`, not `saved_routes`, the query returns 0 rows and `.single()` throws a PGRST116 error, displaying "Failed to load trip data".

## Solution

Update `useTripReplay.ts` to gracefully handle the case where `routeId` does not exist in `saved_routes`. Instead of throwing on error, fall through and treat `routeId` as a `telematicsId` (lesson_telematics ID).

## Technical Changes

### File: `src/hooks/useTripReplay.ts`

Change the `saved_routes` query (lines 78-89) to use `.maybeSingle()` instead of `.single()`, and only throw on actual database errors (not "no rows found"). If no saved route is found, fall through and use `routeId` as the `sessionId` for the telematics/Quartix lookup:

```typescript
if (routeId) {
  const { data: routeData, error: routeError } = await supabase
    .from("saved_routes")
    .select(`*, pupil:pupil_id (name)`)
    .eq("id", routeId)
    .maybeSingle();

  if (routeError) throw routeError;

  if (routeData) {
    setRoute(routeData as RouteData);
    sessionId = routeData.telematics_id;
  } else {
    // routeId is likely a lesson_telematics ID, use it directly
    sessionId = routeId;
  }
}
```

This is the only change needed -- the rest of the hook already handles fetching GPS points from `telematics_gps_points` and falling back to Quartix route data.
