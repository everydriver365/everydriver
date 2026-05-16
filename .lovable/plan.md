
## Goal

Google Calendar (mirrored into `instructor_calendar_events`) becomes the **only** source of "instructor is busy". The `scheduled_lessons` table stays for CRM / billing / lesson history, but it is **never** read when computing availability or clashes.

Every booking already writes a Google event (we have `google_event_id` on every row). After this change, that Google event — not the DB row — is what blocks the slot.

## What changes

### 1. Availability engine (`src/lib/availabilityEngine.ts`)
- Stop accepting `lessons` as a conflict source. The signature `buildDayConflicts(dateStr, lessons, blocks, events)` becomes `buildDayConflicts(dateStr, blocks, events)`.
- Conflict kinds reduce to `block` (manual day-off) and `event` (Google Calendar busy).
- Per-pupil `travel_time_minutes` override no longer applies (there is no pupil context on a Google event). Only the instructor's `buffer_minutes` gates spacing.
- All-day / >12h Google events stay informational (existing rule kept).

### 2. Thin wrapper (`src/lib/availabilityCore.ts`)
- Update re-exported `buildDayConflicts` signature to match.
- Remove the `pupil_travel_min` type field.

### 3. Data fetchers — stop querying `scheduled_lessons` for availability
Update every caller that builds conflicts from `scheduled_lessons` to drop that query and pass only `manual_blocks` + `calendar_events`:
- `src/hooks/useRealGapSlots.ts`
- `src/hooks/useAvailabilityData.ts`
- `src/hooks/useGapSuggestions.ts`
- `src/components/booking/LessonScheduler.tsx` (slot computation + month-jump check + initial-date check)
- `src/pages/Courses.tsx` (`instructorMinSlotMinutes` resolver and `coursesForSelectedDate`)
- `src/pages/everydriver/BookingSummary.tsx`
- `src/components/booking/MobileBookingView.tsx`
- `src/lib/courseAvailability.ts` (if it pulls lessons — verify)
- `src/lib/lessonClashCheck.ts` (clash check now reads Google events only)
- Any "fill gap / find slot / add lesson / reschedule" surface that currently joins `scheduled_lessons`.

### 4. Server-side booking guard (`supabase/functions/create-booking/index.ts`)
- Before writing the lesson, force a fresh Google fetch for the target day (call into `google-calendar-service.resyncRange` for that window) so the cache is current.
- Then validate the requested slot against `instructor_calendar_events` + `instructor_manual_blocks` only — no `scheduled_lessons` read.
- Continue creating the Google event and storing `google_event_id`.

### 5. Freshness — on-demand Google refresh
Booking surfaces already call `refreshGoogleCalendar` (60s TTL). Keep that. Also:
- Call it on the **course search resolver** so search results reflect the latest Google state, not just the cron'd snapshot.
- Call it again immediately before the booking-confirm POST (force=true) to close the race between "user opened the slot list" and "user clicked confirm".

### 6. Backfill / dedupe
Existing junk `scheduled_lessons` (e.g. Ken's 36 test rows) stop affecting availability the moment step 1–3 ships, even before deletion. We still recommend a one-off cleanup pass for hygiene, but it is no longer blocking.

### 7. Docs / memory
- Update `mem://features/booking/calendar-sync-reliability` and the GCal architecture memory to state: **Google Calendar (mirrored to `instructor_calendar_events`) is the sole source of busyness. `scheduled_lessons` is CRM data only.**
- Update the engine header comment so future agents do not re-introduce `scheduled_lessons` as a conflict source.

## Trade-offs to confirm

1. **Latency between booking and slot lockout.** A booking writes the Google event in the same request as the DB row. If the Google API call fails (or is slow), the slot is **not** blocked for other learners until the next sync. Today the DB row blocks it instantly. Acceptable?
2. **Per-pupil travel time disappears from the booking calendar** (no pupil identity on a Google event). The instructor's `buffer_minutes` is the only spacing rule. Acceptable, or should we keep travel time as an override when an `instructor_calendar_events` row carries our `google_event_id` and we can look the pupil back up?
3. **Manual blocks (`instructor_manual_blocks`) stay** as a separate, instructor-owned "block this time" mechanism distinct from Google. Confirm — or should those also be pushed into Google and deleted from the DB?
4. **Existing scheduled lessons in the DB without a matching Google event** (e.g. Ken's test rows, or any historical row where the Google push failed) will immediately appear bookable. Confirm that is the desired behaviour.

## Files touched (approx.)

```text
src/lib/availabilityEngine.ts            (signature + conflict kinds)
src/lib/availabilityCore.ts              (re-export shim)
src/lib/lessonClashCheck.ts              (Google-only check)
src/lib/courseAvailability.ts            (drop scheduled_lessons)
src/hooks/useRealGapSlots.ts
src/hooks/useAvailabilityData.ts
src/hooks/useGapSuggestions.ts
src/components/booking/LessonScheduler.tsx
src/components/booking/MobileBookingView.tsx
src/pages/Courses.tsx
src/pages/everydriver/BookingSummary.tsx
supabase/functions/create-booking/index.ts
mem://features/booking/calendar-sync-reliability  (rule update)
mem://constraints/google-calendar-source-of-truth (new constraint)
```

Please confirm the four trade-offs above (especially #1, #2 and #4) and I'll implement.
