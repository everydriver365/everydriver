

## Plan: Wire Up Smart Buffer to Scheduling & Calendar

### What's Changing
Make the smart buffer settings actually work — apply travel-time or flat buffer when checking slot availability and when creating Google Calendar events.

### Changes

| Area | File(s) | Change |
|------|---------|--------|
| **Slot availability** | `src/components/instructor/end-lesson/StepBookNext.tsx` | When `smart_buffer_enabled` + mode is `travel_time` or `travel_time_plus`, call `check-travel-buffer` edge function using the pupil's postcode and adjacent lesson postcodes instead of using flat `buffer_minutes` |
| **Booking portal slots** | `src/components/booking/LessonScheduler.tsx` (or equivalent slot calculator) | Same logic — if smart buffer enabled, use travel time between consecutive lesson postcodes to determine minimum gap |
| **Calendar event padding** | `supabase/functions/process-calendar-queue/index.ts` | When creating/updating Google Calendar events, extend the event time or add a separate "travel" event block based on the instructor's buffer settings and adjacent lesson postcodes |
| **Helper hook** | `src/hooks/useSmartBuffer.ts` | **New** — shared hook that takes instructor ID + two postcodes, checks smart buffer settings, and returns the required buffer minutes (either flat or via `check-travel-buffer` call) |

### Buffer Logic

```text
Get instructor smart_buffer settings
  ↓
smart_buffer_enabled = false?
  → Use flat buffer_minutes (existing behaviour)
  ↓
mode = "flat"?
  → Use flat buffer_minutes
  ↓
mode = "travel_time"?
  → Call check-travel-buffer(from_postcode, to_postcode)
  → Use returned travel_minutes as buffer
  ↓
mode = "travel_time_plus"?
  → Call check-travel-buffer with padding_minutes
  → Use travel_minutes + padding as buffer
```

### Calendar Buffer Display
When creating Google Calendar events, add the buffer as either:
- Extended event duration (e.g., 60min lesson shows as 75min with 15min travel), or
- A separate "Travel to [pupil name]" event in the gap

### Prerequisites
- Pupils need a `postcode` field populated (already exists in the schema)
- Adjacent lessons need postcodes to calculate travel between them
- `TOMTOM_API_KEY` secret is already configured

### No database changes needed
All settings columns already exist on the `instructors` table. Pupil postcodes are already stored.

