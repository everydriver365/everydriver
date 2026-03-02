

## Live Instructor Location & ETA for Pupils (En Route Only)

### How It Works
When an instructor marks a lesson as "en route" (already triggers `status: 'en_route'` on `scheduled_lessons`), the pupil portal shows a live map with the instructor's position and a calculated ETA. The map disappears when the lesson status changes to `in_progress` or `completed`.

### Infrastructure Already In Place
- `gps_devices` table stores real-time instructor lat/lng via Geotab (updated every 10s)
- `useInstructorLastPosition` hook subscribes to realtime GPS updates
- `scheduled_lessons.status = 'en_route'` is already set when instructor taps "Send ETA"
- Pupil portal already has realtime subscription for lesson status changes
- `calculate-traffic-eta` edge function computes ETA using HERE API
- Google Maps SDK loader already exists

### New Components

**`src/components/pupil-portal/InstructorEnRouteTracker.tsx`**
- Renders only when the next lesson has `status === 'en_route'`
- Shows a Google Maps mini-map with the instructor's live position (arrow marker)
- Displays ETA text (e.g. "Your instructor is ~8 mins away") calculated from instructor GPS to pupil pickup postcode
- Auto-refreshes ETA every 30 seconds using `calculate-traffic-eta`
- Auto-hides when lesson status changes away from `en_route`
- Includes traffic condition indicator (clear/light/moderate/heavy)

**`src/hooks/useInstructorEnRouteETA.ts`**
- Takes `instructorId` and `pickupPostcode`
- Reads instructor position from `gps_devices` via realtime subscription (reuses pattern from `useInstructorLastPosition`)
- Calls `calculate-traffic-eta` edge function with instructor lat/lng as origin and pickup postcode as destination
- Returns `{ etaMinutes, etaText, trafficCondition, instructorLat, instructorLng, isLoading }`
- Refreshes every 30s while active

### Integration Points

| File | Change |
|------|--------|
| `src/pages/BrandedPupilPortal.tsx` | Import & render `InstructorEnRouteTracker` on home section when next lesson is `en_route` |
| `src/pages/PupilPortal.tsx` | Same — show tracker when any upcoming lesson is `en_route` |
| `src/components/pupil-portal/PupilPortalLessonCountdown.tsx` | Add realtime subscription for lesson status; when `en_route`, swap countdown for the tracker |

### Database Changes
- **RLS policy on `gps_devices`**: Add a SELECT policy allowing pupils to read their instructor's device position (scoped: pupil can only see the instructor they're assigned to). This is needed because currently only instructors/admins can read `gps_devices`.

```sql
CREATE POLICY "Pupils can view their instructor GPS position"
ON public.gps_devices FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pupils p
    WHERE p.instructor_id = gps_devices.instructor_id
    AND p.id = auth.uid()::text::uuid
  )
);
```

Note: Since pupils access the portal via OTP (not Supabase Auth), the GPS data will be fetched via an edge function instead, avoiding RLS complexity.

**Alternative approach (preferred)**: New edge function `get-instructor-location` that:
- Accepts `pupil_id` and `lesson_id`
- Validates the lesson belongs to the pupil and has `status = 'en_route'`
- Returns instructor lat/lng from `gps_devices` (only if en_route)
- This keeps GPS data secure — pupils only get position during active en_route

### New Edge Function

**`supabase/functions/get-instructor-location/index.ts`**
- Validates: lesson exists, belongs to pupil, status is `en_route`
- Reads instructor's latest position from `gps_devices`
- Returns `{ latitude, longitude, heading, eta_minutes, eta_text, traffic_condition }` (calls HERE API inline for ETA)
- Returns 403 if lesson is not en_route (security gate)

### Security
- Instructor position is ONLY exposed when a lesson is actively `en_route`
- Pupil can only see their own instructor's position
- Position data is not stored on client — fetched fresh each poll
- Auto-stops polling when status changes

### Files Summary

| Action | File |
|--------|------|
| Create | `supabase/functions/get-instructor-location/index.ts` |
| Create | `src/hooks/useInstructorEnRouteETA.ts` |
| Create | `src/components/pupil-portal/InstructorEnRouteTracker.tsx` |
| Modify | `src/pages/BrandedPupilPortal.tsx` — add tracker to home |
| Modify | `src/pages/PupilPortal.tsx` — add tracker to home |
| Modify | `src/components/pupil-portal/PupilPortalLessonCountdown.tsx` — integrate tracker when en_route |

