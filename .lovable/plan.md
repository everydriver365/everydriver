
# Unified Availability Engine

## Goal

Replace the 6+ separate slot calculators with **one function** that every booking surface — and the server-side `create-booking` guard — calls. This ends the whack-a-mole where fixing one screen breaks another (Ken D being the latest example).

## The single source of truth

New file: `src/lib/availabilityEngine.ts`

Signature:
```ts
resolveAvailability({
  instructorId, date, durationMinutes,
  pupilId?, timeOfDay?, isCourseBooking?
}) → { slots, rejected, diagnostics }
```

It runs the same pipeline every time:

```text
1. Load working_hours for that weekday
2. Load scheduled_lessons (app diary) for the date
3. Load manual_blocks overlapping the date
4. Load instructor_calendar_events (Google) for the date
5. Filter Google events:
     - timed event  → BLOCKS
     - all-day      → IGNORED (informational)
     - multi-day >12h → IGNORED (informational)
6. Apply instructor.buffer_minutes
7. Apply per-pupil travel_time_minutes (pupil_travel_min)
8. Apply first-lesson-of-day rule (no leading buffer)
9. Walk the day in 15-min steps, emit slots that fit duration
10. Return { slots, rejected: [{ time, reason }] }
```

## What gets deleted / migrated

| File | Action |
|---|---|
| `src/lib/availabilityCore.ts` | Folded into engine |
| `src/lib/courseAvailability.ts` | Folded into engine |
| `src/lib/lessonClashCheck.ts` | Folded into engine |
| `src/components/booking/LessonScheduler.tsx` | Delete local slot logic, call engine |
| `src/hooks/useInstructorAvailabilitySearch.ts` | Call engine |
| `src/hooks/useRealGapSlots.ts` | Call engine |
| `src/pages/Courses.tsx` availability check | Call engine |
| `supabase/functions/create-booking/index.ts` | Call engine (shared copy) before confirming |

## Server-side guard (critical)

The engine also runs inside `create-booking`. Even if a stale UI offers a slot, the server re-checks and rejects it with a clear reason. The UI and server can never disagree.

Implementation: a small Deno-compatible copy of the engine lives in `supabase/functions/_shared/availabilityEngine.ts`, imported by `create-booking` and any other function that needs to validate a slot.

## Google Calendar rules — codified

Written down once, applied everywhere:

- **Timed event** → blocks that time window
- **All-day event** (00:00–23:59 single day) → informational, does NOT block
- **Multi-day event** (>12h duration or spans dates) → informational, does NOT block
- **Manual block** in the app → always blocks

If an instructor wants an all-day Google event to block bookings, they add a manual block. This is predictable and matches how every other scheduler in the industry behaves.

## Diagnostic mode

The engine returns a `diagnostics` object the UI can render in a dev panel:

```text
Ken D · 2026-06-01 · 2h lesson
Working hours: 09:00–18:00
Conflicts:
  ✓ Lesson 10:00–11:00 (app diary)       blocking
  ✗ "Summer term" Apr–Jul (Google)        skipped: multi-day
  ✗ "Lotty No College" 1–2 Jun (Google)   skipped: multi-day
Buffer: 15 min · Travel: 10 min
Slots offered: 12:15, 13:15, 14:15, 15:15, 16:00
```

This makes future debugging take seconds.

## Verification before ship

1. Run engine against Ken D (`c9843b58-…`) for 1 Jun, 7 Jun, plus the week he reported broken — confirm slots match what he expects.
2. Run against 2 other live instructors with different buffer / travel settings.
3. Confirm `create-booking` rejects a manually-crafted clashing payload.
4. Confirm course booking, single-lesson booking, and Fill-Gaps all return identical slot lists for the same inputs.

## What is explicitly NOT changing

- Database schema (no migrations needed)
- Google Calendar sync architecture (service account + DWD, per memory)
- Mobile layouts
- Payment flows
- Buffer / travel time / first-lesson rules — same rules, just enforced in one place

## Effort

- Day 1: Build engine + diagnostic + edge function copy
- Day 2: Migrate 6 surfaces to call it, delete old code
- Day 3: Verify against Ken D + 2 other instructors, ship

## Risk

Low. The engine is a pure function over inputs you already query today. Old files stay in place until each caller is migrated, so rollback per-surface is trivial.

## Files touched

**Created**
- `src/lib/availabilityEngine.ts`
- `supabase/functions/_shared/availabilityEngine.ts`

**Edited**
- `src/components/booking/LessonScheduler.tsx`
- `src/hooks/useInstructorAvailabilitySearch.ts`
- `src/hooks/useRealGapSlots.ts`
- `src/pages/Courses.tsx`
- `supabase/functions/create-booking/index.ts`

**Deleted (after migration)**
- `src/lib/availabilityCore.ts`
- `src/lib/courseAvailability.ts`
- `src/lib/lessonClashCheck.ts`
