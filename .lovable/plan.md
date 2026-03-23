

## Plan: Simplify Buffer to Flat Instructor Setting Only

### What's Changing
Strip out all smart buffer / travel-time logic. The buffer between lessons should only ever be the flat `buffer_minutes` value the instructor sets — nothing else.

### Changes

| File | Change |
|------|--------|
| `src/components/instructor/end-lesson/StepBookNext.tsx` | Remove `useSmartBufferSettings` and `getSmartBufferMinutes` imports. Fetch `buffer_minutes` directly from the instructor row. Use that single flat value for all conflict checks — no postcode lookups, no travel time calls. |
| `supabase/functions/process-calendar-queue/index.ts` | Remove the entire smart buffer block (lines ~341-401) that geocodes postcodes and calls TomTom. Just use the lesson's actual duration for the calendar event — no travel-time extension. |
| `src/components/instructor/SmartBufferSettings.tsx` | Remove this component entirely — no need for travel-time mode selection UI. |
| `src/hooks/useSmartBuffer.ts` | Remove this file entirely. |

### Result
- Buffer = `instructors.buffer_minutes` (flat value), always
- No TomTom API calls during scheduling or calendar sync
- No smart buffer UI in settings
- Calendar events show exact lesson duration only

