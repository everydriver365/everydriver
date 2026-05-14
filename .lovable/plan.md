## Plan

1. **Correct the day-number mismatch consistently**
   - The main Courses page currently converts `availability_windows` Sunday to `0`, but the rest of the page now checks dates as `1=Mon … 7=Sun`.
   - I’ll remove that remap so both `instructor_working_hours` and `availability_windows` are evaluated with the same day numbering.
   - Apply the same correction to `src/pages/everydriver/Courses.tsx`.

2. **Make list rows identify the instructor clearly**
   - The June results do include 9 courses, but at the current scroll position the list rows hide the instructor column off-screen / out of view, so Ken’s five rows look like unnamed generic course rows.
   - I’ll update the list row details text so each row visibly includes the instructor name, e.g. `Ken D · Starts Mon 1 Jun`, without changing booking logic.

3. **Verify the June scenario**
   - Recheck `/courses?postcode=SO225AB`, switch to June, select 1 June, and confirm both Richard and Ken are visible and the course count remains correct.