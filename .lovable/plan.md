

## Plan: Travel-time-aware slot filtering in booking

### Problem
Currently, the LessonScheduler uses a flat `buffer_minutes` between lessons and calendar events. When a client picks a lesson time, the system doesn't consider how long it takes the instructor to travel from their home to the pupil's pickup location. This means the instructor might not have enough time to arrive.

### Approach
When the pupil enters their postcode (or pickup postcode), calculate the travel time from the instructor's `home_postcode` to that postcode using the existing `check-travel-buffer` edge function. Use the result as an "effective buffer" for the **first slot of the day** (or any slot that follows a gap where the instructor would be coming from home). This effective buffer is `max(travel_minutes, buffer_minutes)` — it overrides the flat buffer but is never less than it.

### Changes

**1. `src/components/booking/LessonScheduler.tsx`**
- Add new optional props: `instructorHomePostcode?: string` and `pupilPostcode?: string`
- When both postcodes are provided, call the `check-travel-buffer` edge function once on mount to get `travel_minutes` from home to pupil
- Store the result as `travelBufferMinutes` state
- Compute `effectiveBuffer = Math.max(travelBufferMinutes ?? 0, bufferMinutes)`
- In `getAvailableTimeSlots()`: for each candidate time slot, determine if the instructor would be "coming from home" (i.e., it's the first lesson of the day — no preceding calendar event or selected slot). If so, the slot must start at least `effectiveBuffer` minutes after the working hours start time. For slots adjacent to other events/lessons, continue using the flat `bufferMinutes` as today.
- This means: if travel time is 25 min and buffer is 15 min, the earliest first lesson can start is working-hours start + 25 min. But between back-to-back lessons (where the instructor is already at location), the normal 15 min buffer applies.

**2. `src/pages/BookingSummary.tsx`**
- Pass `instructorHomePostcode={instructor.home_postcode}` and `pupilPostcode={differentPickup ? pickupPostcode : pupilPostcode}` to the `LessonScheduler` component

**3. `src/components/booking/MobileBookingView.tsx`**
- Same props passed through to `LessonScheduler`

**4. `src/components/instructor/end-lesson/StepBookNext.tsx`**
- When finding available slots, fetch instructor `home_postcode` and use the same travel-time check to apply effective buffer instead of flat buffer

### Technical details
- The `check-travel-buffer` edge function already exists and uses TomTom routing + postcodes.io geocoding
- The travel time lookup happens once when postcodes are available, not per slot
- If the API call fails, falls back to the flat `buffer_minutes` (graceful degradation)
- The effective buffer only applies to the first slot of the day; mid-day gaps between lessons still use flat buffer since the instructor is already in the area

