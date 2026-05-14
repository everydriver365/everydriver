## What I checked

For `/courses?postcode=SO225AB` with a date in June 2026:

**Ken D** (`c9843b58…`):
- `is_active = true`, `available_from = 2026-06-01` ✓
- `home_postcode = SO30 2TD`, has `lat/lng` ✓
- 5 active courses (10/20/30/40/28h) — all in `DISPLAY_HOURS` ✓
- Working hours present in `instructor_working_hours`: Mon–Fri 10:30–16:00, Sat/Sun 07:00–12:00 ✓
- 288 busy Google Calendar events in range, all stored in UTC

**Richard Chapman**: same postcode, no `instructor_working_hours` rows, but `availability_windows` Mon–Fri 08–20, Sat/Sun 08–12. He shows because the resolver reads `availability_windows`.

**Resolver math for Ken on Mon 8 June** (BST = UTC+1):
- Working window 10:30–16:00 (local)
- Busy events parsed as local time: 07:00–10:00, 13:00–16:00, 18:00–21:00
- Only 13:00–16:00 falls inside the window
- Free remainder: 10:30–13:00 = 150 min (≥ 60 min minimum)

By the resolver Ken **should** appear. Both instructors share the same postcode → same geocoded distance, so the 10‑mile radius can't be filtering only Ken.

## What's most likely going wrong

The resolver and data look correct, so the failure is almost certainly one of three runtime issues that I cannot prove without instrumentation:

1. **Geo cache collision on identical postcode.** Both share `SO302TD`. If Richard's geocode returns first, both get his lat/lng — fine. But if `instructor.lat/lng` is used as fallback (not the cache) for one and not the other, distances diverge. Ken's stored `lat=50.928` puts him ~9.2 mi from SO22 5AB — borderline at 10 mi default radius.
2. **`scheduled_lessons` rows we haven't inspected for Ken in June** could be filling the only remaining 150‑min gap.
3. **A duplicate working‑hours row or override** (none found in Ken's data, but worth confirming after every refresh).

## Plan

1. **Add temporary diagnostic logging in `src/pages/Courses.tsx`** keyed off `?debug=avail`:
   - For every instructor in `relevantInstructors`, log `id / name / distance / hasInstructorAvailabilityOn(selectedDate)` and the windows/conflicts the resolver computed for that day.
   - Output one compact table once per `selectedDate` change.

2. **Reproduce on `/courses?postcode=SO225AB&debug=avail`**, click into June 8 (Mon), read the log, and identify whether Ken is dropped at:
   - radius (`instructorsInArea`), or
   - resolver (`hasInstructorAvailabilityOn` returning false), or
   - course mapping (no `course_hours` match).

3. **Apply the targeted fix** based on whichever stage drops him:
   - If radius: prefer geocoded postcode over `instructor.lat/lng`, and bump the implicit minimum to cover postcode‑level imprecision (e.g. `radius + 1 mi` tolerance for shared‑postcode cases).
   - If resolver: most likely a UTC/BST window comparison or a `scheduled_lesson` we haven't surfaced — fix in `src/lib/courseAvailability.ts` and re‑verify.
   - If course mapping: extend `DISPLAY_HOURS` handling.

4. **Remove the debug logging** once verified, and confirm Ken's avatar shows on the same URL for at least one June date where Richard also shows.

### Files to touch

- `src/pages/Courses.tsx` (debug log → targeted fix, then remove log)
- Possibly `src/lib/courseAvailability.ts` (only if step 2 points there)

No schema or backend changes.
