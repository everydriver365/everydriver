

## Fix: Enforce instructor lesson length preferences strictly

### Problem
The current smart duration filter (`durationOptions`) can inject arbitrary "completion" durations (e.g. 1hr) that the instructor never allowed. If an instructor only allows 2hr and 3hr lessons, a 10hr course could end up with a 1hr lesson — which the instructor didn't approve.

Additionally, the `DEFAULT_LESSON_LENGTHS` fallback offers 1–7 hour options even when the instructor has set specific preferences, and the minimum allowed length is never enforced.

### Solution

**In `src/components/booking/LessonScheduler.tsx`:**

1. **Never offer durations below the instructor's minimum** — the smallest value in `baseDurationOptions` is the floor. Remove the fallback that injects `remainingMinutes` as a completion option when it's shorter than the minimum allowed length.

2. **Smarter filtering that respects instructor preferences** — instead of blindly adding `remainingMinutes` as a completion option, only add it if it's ≥ the instructor's minimum allowed length. If not, adjust the filtering to guide users toward combinations that divide evenly:
   - Filter `baseDurationOptions` to only show lengths where `remainingMinutes - d` can be filled by allowed lengths OR equals zero.
   - If no combination works (e.g. 10hrs with only 3hr allowed), show a message: "This course cannot be evenly divided into 3-hour lessons. Contact the instructor." — rather than silently creating a 1hr lesson.

3. **Warn early at course selection** — if `totalHours` can't be divided by any combination of `allowedLessonLengths`, show a warning before the user starts picking slots.

### Changes

| Area | Change |
|------|--------|
| `durationOptions` memo (lines 373–404) | Remove the fallback that adds `remainingMinutes` when it's below the minimum allowed length. Only inject completion durations that are ≥ `baseDurationOptions[0]`. |
| `completionDuration` memo (lines 407–411) | Update to only flag non-standard durations that are still ≥ minimum. |
| New: upfront validation | Add a `useMemo` that checks if `totalHours * 60` can be filled by `baseDurationOptions`. If not, show a warning banner. |
| Completion hint text | Update to say the instructor's allowed range, not just "added to complete". |

