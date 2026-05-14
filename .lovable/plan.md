## Why Richard isn't showing

I checked the database directly. Richard **does** have working hours — they were saved on 7 May into the `availability_windows` table (Mon–Fri 08:00–20:00, plus Sat & Sun mornings). The other instructors (Ken, Martin, Sarah) keep theirs in a different table, `instructor_working_hours`. The courses page reads from both and merges them, so in theory Richard should appear.

Two bugs are stopping him:

### Bug 1 — RLS hides Richard's hours from the public site
`instructor_working_hours` has a policy `Working hours publicly viewable for booking (USING true)`, so unauthenticated visitors can read it. `availability_windows` has only one policy: instructors can manage **their own** rows. There is **no public SELECT policy**. So when an anon visitor loads `/courses`, the API returns `[]` for that table — confirmed in the network log. Without any matching availability rows, the date filter drops Richard's courses entirely.

### Bug 2 — Day-of-week numbering mismatch
Richard's rows are stored with `day_of_week` values **1–7** (ISO style: Mon=1 … Sun=7). The courses page compares against `date.getDay()`, which uses the JavaScript convention **0–6** (Sun=0 … Sat=6). After fixing the RLS, days 1–6 would happen to line up for Mon–Sat, but Sunday would never match (stored as 7, JS expects 0). The Availability Windows manager UI also assumes 0–6, which is why Richard's saved hours probably look wrong inside his portal too.

## Plan

### 1. Database migration — add public SELECT policy on `availability_windows`

Mirror the existing `instructor_working_hours` policy:

```sql
CREATE POLICY "Availability windows publicly viewable for booking"
  ON public.availability_windows
  FOR SELECT
  USING (true);
```

Only non-PII columns are exposed (`instructor_id`, `day_of_week`, `start_time`, `end_time`, `is_active`, `label`) — same shape as the other table the public booking flow already reads.

### 2. Normalise day numbers when merging in `src/pages/everydriver/Courses.tsx`

Where the two availability sources are unioned (around line 838), remap any `day_of_week === 7` from `availability_windows` to `0` so it lines up with `date.getDay()`:

```ts
const loadedWorkingHours = [
  ...(workingHoursRes.data || []),
  ...((availabilityWindowsRes.data || []).map((w: any) => ({
    ...w,
    day_of_week: w.day_of_week === 7 ? 0 : w.day_of_week,
  }))),
];
```

Apply the same normalisation in `src/pages/Courses.tsx` (the older courses page that reads the same tables).

### 3. Verify

- Reload `/courses?postcode=SO225AB` (or SO30 2TD) — Richard's card should appear in the "Your Instructor" sidebar (or the multi-instructor list in grid mode), and his courses in the results.
- Check Sunday is now treated as available for Richard.

### Out of scope (flagging for later)

The `AvailabilityWindowsManager` UI in the instructor portal stores `day_of_week` inconsistently (defaults to `1`, lets the user pick 1–7) but renders by filtering `day_of_week === i` with `i` running 0–6. That's a separate fix to standardise the manager on 0–6 (or migrate all rows to ISO 1–7 and update every reader). Not needed to make Richard show on the public courses page — say the word and I'll do it as a follow-up.
