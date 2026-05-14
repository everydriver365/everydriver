# One availability engine for search + booking

## What's actually wrong today

The codebase already contains a comprehensive availability resolver — `src/lib/courseAvailability.ts` — that reads working hours (both DOW conventions), date overrides, manual blocks, scheduled lessons, **and** Google Calendar busy events from `instructor_calendar_events`. It correctly ignores all-day informational events, handles overlapping windows, and returns "is this instructor genuinely free".

Three things are wrong with how it's wired:

1. **The EveryDriver results page (`src/pages/everydriver/Courses.tsx`, 1876 lines) does not use it.** It has its own broken resolver that only loads `instructor_working_hours` rows without their times, never queries calendar events, manual blocks, or lessons, and treats "any active row for that DOW" as "available all day". This is why Ken disappears for some months and why the same postcode returns different results on `/courses` vs `/intensives`.
2. **`useCourseDiscovery` (the hook used by `/intensives`, `/semi-intensive`) also has its own resolver** — better than the Courses.tsx one, but still parallel code.
3. **The booking flow only validates against the DB trigger `prevent_lesson_clash`**, which knows about `scheduled_lessons` only. It does NOT block a booking that lands on a Google Calendar event, a manual block, or inside an instructor's buffer/travel window.

The resolver is also missing two policy bits you mentioned: instructor-defined **buffer minutes** and **travel time** padding around conflicts, and a check that the **course duration** actually fits in the remaining free span.

## Target

One resolver. Two consumers. Zero per-instructor maintenance.

```text
                 ┌──────────────────────────────┐
                 │  src/lib/courseAvailability  │  ← single source of truth
                 │  (working hrs + overrides +  │
                 │   lessons + blocks + GCal +  │
                 │   buffer + travel + duration)│
                 └──────────────┬───────────────┘
                                │
              ┌─────────────────┼──────────────────┐
              ▼                                    ▼
    Search results page              Booking submit guard
    (one unified page)               (edge function: validate-booking)
```

When a new instructor signs up and configures their working hours, buffer, travel time, and connects Google Calendar, the same resolver picks it all up automatically — no code change.

## Plan

### 1. Extend the resolver (`src/lib/courseAvailability.ts`)

Add three things to `hasInstructorAvailabilityOn` and a new `firstFittingSpanOn` helper:

- **Buffer + travel padding.** Accept `bufferMinutes` and `travelMinutes` per instructor. When subtracting conflicts, expand each conflict by `bufferMinutes + travelMinutes` on both sides (matching `availabilityCore.ts`'s existing convention used in Find Slot / Fill Gaps). First lesson of the day uses travel-from-home; back-to-back uses buffer only — the existing "lesson-buffer-logic" memory rule.
- **Course-duration fit.** Replace the current `MIN_FREE_MINUTES = 60` constant with a `requiredMinutes` parameter. For an N-hour intensive that's typically 2–4 hours per day across multiple days; for a single weekly lesson it's the lesson length. The caller passes what it needs.
- **`CourseAvailabilitySources` loader.** Add `loadCourseAvailabilitySources(instructorIds, dateRange)` so both consumers fetch the same six tables in the same way (working hours, availability windows, overrides, manual blocks, scheduled lessons, calendar events) with `select('*')` shapes that match the resolver. One round-trip per page load instead of N.

No DB schema changes needed — all tables and `instructor_calendar_events` already exist.

### 2. One unified search results page

- New component `src/pages/everydriver/CourseResults.tsx` modelled on the working `Intensives.tsx` shell. Uses shared `CourseSearchHeader` + `SidebarCalendar` + `CourseGrid`, powered by `useCourseDiscovery` which is migrated to call the extended `courseAvailability` resolver instead of its own private logic.
- Reads `?postcode=` and `?type=` from the URL. A small segmented control switches All / Intensive / Semi-Intensive without a page reload.
- Routes `/courses`, `/search`, `/drive365/search`, `/services` → `<CourseResults defaultType="all" />`.
- `/intensives` and `/semi-intensive` keep their hero + render `<CourseResults defaultType="intensive" hero={...} />`.
- Delete `src/pages/everydriver/Courses.tsx`.

### 3. Booking-flow guard (the part that was missing)

The DB trigger `prevent_lesson_clash` stays as the last-line backstop against double-booking lessons against lessons. We add an edge function `validate-booking` that the booking flow calls before insert:

- Inputs: `instructor_id`, `lesson_date`, `start_time`, `duration_minutes`, optional `pupil_pickup_postcode`.
- Loads the same six sources via the new shared loader, runs the resolver, and returns `{ ok: boolean, reason?: 'gcal_conflict' | 'manual_block' | 'buffer' | 'outside_working_hours' | 'lesson_clash', conflict_window?: {...} }`.
- The booking summary screen (`EDBookingSummary`) calls this on submit. If `ok=false`, show the reason and refuse to submit.
- Same function is reusable from the instructor-facing booking screens, the parent portal, and any future channel (WhatsApp bot, AI agent). One rule, one place.

### 4. New-instructor "just works" guarantee

Because the resolver reads the standard tables every instructor populates during onboarding (`instructor_working_hours`, `instructor_buffer_minutes` / `instructor_travel_minutes` on the instructor row, `instructor_google_service_calendar` for GCal sync), a brand-new instructor who:
- sets their weekly working hours,
- sets a buffer and travel-time default,
- connects their Google Calendar,

…immediately appears correctly in search results and is correctly protected at booking time. No per-instructor migration, no code change, no Lovable visit needed.

### 5. QA pass after build

- `/courses?postcode=SO302TD` (your current URL) returns the same instructor list as `/intensives?postcode=SO302TD`, only differing by which course rows show.
- Ken appears for June (Saturdays/Sundays no longer dropped).
- Block 10–11 on an instructor's Google Calendar → that hour is removed from availability and a 9–11 lesson at the booking step is rejected with `gcal_conflict`.
- Set buffer = 30 min, travel = 15 min → a back-to-back 9-hour intensive is only offered on days with one contiguous span ≥ (course hours × 60) + buffer/travel padding.
- Brand-new test instructor with only working hours filled in → appears in results without any code changes.

## What this does NOT do

- Does not change instructor working-hour, buffer, travel, or Google Calendar **inputs** — only how they're consumed.
- Does not touch `/theory`, instructor portal, school portal, or Drive365 (non-EveryDriver) public routes.
- Does not change card visuals, calendar visuals, or the booking summary layout.
- Does not change the `prevent_lesson_clash` DB trigger (kept as backstop).

## Technical notes (for the build pass)

- `src/lib/courseAvailability.ts` — extend `hasInstructorAvailabilityOn` signature: add `instructor.bufferMinutes`, `instructor.travelMinutes`, `requiredMinutes`. Replace `MIN_FREE_MINUTES` constant with the parameter; default to current value for backwards compat.
- New `loadCourseAvailabilitySources(instructorIds: string[], from: Date, to: Date): Promise<CourseAvailabilitySources>` co-located in the same file.
- `useCourseDiscovery` — replace internal availability logic with calls to `loadCourseAvailabilitySources` + `hasInstructorAvailabilityOn`. Drop the duplicated WorkingHours/DateOverride loading.
- New edge function `supabase/functions/validate-booking/index.ts` — service-role read on the six tables, runs the resolver, returns JSON. Wired into `src/pages/everydriver/BookingSummary.tsx` on confirm.
- Files retired: `src/pages/everydriver/Courses.tsx` (1876 lines), and the bespoke availability functions inside `useCourseDiscovery` (~150 lines).
