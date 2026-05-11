Root cause found: the slot search is treating synced all-day calendar items as hard busy blocks. For Ken D, entries like “Summer term”, “Lotty : College AM/PM”, and “No College” span whole days or date ranges, so the algorithm blocks otherwise valid working-hour slots. That is why only a few slots appear even though the diary has availability.

Plan:
1. Update the availability search to ignore non-actionable all-day calendar events when calculating lesson conflicts, while still respecting actual timed events, scheduled lessons, and manual blocks.
2. Tighten date-range handling so multi-day/all-day events are clipped correctly and do not incorrectly wipe out every day in the search window.
3. Keep the live data source unchanged: working hours, scheduled lessons, manual blocks, overrides, and busy timed calendar events will still be used.
4. Verify on `/instructor/find-appointment?next=1` that “Show more slots” displays the expected wider list of available slots instead of being suppressed by all-day calendar noise.