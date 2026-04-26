## Goal

In the New Lesson conflict check, ignore all-day calendar events when looking for clashes — except when the event title indicates a Holiday or Annual Leave, which should still block.

## Why

All-day Google Calendar events (birthdays, reminders, "Bin day", etc.) currently mark the entire day as busy and can trigger false clashes for any lesson booked that day. Holidays and annual leave are the only all-day events that genuinely should block lessons.

## Scope

Single file: `src/components/instructor/AddLessonSheet.tsx`, inside the conflict-check `useEffect` where calendar events are normalised into slots (around lines 390–397).

## Approach

1. Detect all-day events on the fly — the schema has no `all_day` column, so treat any event whose duration is ≥ 24 hours (or whose start/end align with local midnight and span the full day) as all-day.
2. Define an allowlist of keywords matched case-insensitively against the event title: `holiday`, `annual leave`, `vacation`, `bank holiday`, `time off`, `leave`, `off work`, `out of office`, `ooo`.
3. When building `eventSlots`, drop any all-day event whose title does NOT match the allowlist. All-day events that DO match are kept and continue to block as today (spanning 00:00–24:00 of the day, so any lesson on that day clashes — which is the intended behaviour for holidays).
4. Non-all-day events behave exactly as today.

## Notes

- No DB schema change, no migration, no other components touched.
- Behaviour for `scheduled_lessons` is unchanged.
- Travel-time checks already skip slots with no postcode, so all-day Holiday slots remain harmless to the soft travel warning.
