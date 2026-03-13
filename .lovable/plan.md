

## Fix: Smart lesson length options to avoid odd remainders

**Problem**: If an instructor allows 3-hour lessons and a pupil books a 10-hour course, they can pick 3+3+3 = 9 hours, leaving 1 hour that doesn't match any allowed length. The current code silently caps duration via `Math.min(selectedDuration, remainingHours * 60)`, creating an awkward fractional lesson.

**Solution**: Filter the duration options dynamically based on remaining hours, and auto-switch to a valid duration when the current selection becomes invalid.

### Changes — `src/components/booking/LessonScheduler.tsx`

1. **Filter duration options by remaining hours**: After each slot is booked, only show lesson lengths that either:
   - Divide evenly into the remaining hours, OR
   - Are ≤ remaining hours (so no lesson exceeds what's left)
   
   Additionally, ensure at least one option can "finish" the course — i.e., one of the allowed lengths equals the remaining minutes exactly.

2. **Smart filtering logic** (new `useMemo`):
   ```
   availableDurations = durationOptions.filter(d => d <= remainingHours * 60)
   ```
   If no duration divides evenly into remaining hours, include the exact remainder as a temporary option (only if it's ≥ 30 mins).

3. **Auto-select valid duration**: When `selectedDuration` is no longer in the filtered list, auto-switch to the closest valid option.

4. **Remove the silent cap** on line 375 (`Math.min(selectedDuration, remainingHours * 60)`). Instead, since we only show valid durations, the selected duration is always valid. Keep a safety guard but don't silently create odd-length lessons.

5. **Show a helper hint**: When remaining hours don't divide evenly by any allowed length, show a small note like "1hr lesson added to complete your course" so the pupil understands why a shorter option appeared.

### Example behaviour
- 10hr course, allowed lengths [2hr, 3hr]:
  - Start: show both 2hr and 3hr
  - After 3+3 (4hr remaining): show 2hr only (since 3hr leaves 1hr orphan). Or show both if user wants 2+2.
  - After 3+3+2 (2hr remaining): show 2hr only
  - Result: 3+3+2+2 = 10 ✓

- 10hr course, allowed lengths [3hr]:
  - Show 3hr + a temporary 1hr option, with hint "1hr lesson to complete your 10hr course"
  - Result: 3+3+3+1 = 10 ✓ (but user sees this upfront)

