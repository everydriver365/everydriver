## Show Chapman's courses without requiring a postcode

**Diagnosis:** `/booking/chapmans` renders fine and both Chapman instructors load, but the embedded course explorer shows its "Enter your postcode" empty state. The public `/courses` page gates the course grid behind `searchedPostcode`, and that gate fires inside the booking-page embed too — even though the embed is already scoped to just Richard + Ken.

**Fix (1 line, `src/pages/Courses.tsx` ~line 1366):**

Change the empty-state condition from:
```tsx
{!searchedPostcode ? ( …Enter your postcode… ) : ( …grid… )}
```
to:
```tsx
{!embedded && !searchedPostcode ? ( …Enter your postcode… ) : ( …grid… )}
```

**Why this is safe**
- `relevantInstructors` already falls back to the full `instructors` list when no postcode/userLocation is set (line 547), and that list is already restricted to the booking page's instructors (line 889). So skipping the gate just shows their courses for the first available date — exactly what's expected on a school booking page.
- Distance/nearest sorting silently no-ops without a userLocation (lines 1121-1124), so no breakage.
- The standalone `/courses` page is unaffected (`embedded` defaults to `false`).

No DB changes, no other files touched.