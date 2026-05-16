# Why the EH12 mock instructors aren't showing — and the fix

## Root cause

The Courses page can't see most placeholders because **both of its bootstrap queries are silently being clipped at the Supabase 1000-row default cap**:

| Query in `src/pages/Courses.tsx` `fetchData` | Rows actually in the DB |
|---|---|
| `public_instructors WHERE is_active` | **5,800** |
| `instructor_courses WHERE is_active` | **26,102** |

PostgREST returns only the first 1,000 rows of each. Whatever Daniel King / Ava Young (EH12) and the vast majority of seeded mock instructors fall outside that window. So:

1. `loadedInstructors` is missing the EH12 placeholders → they never reach `instructorsInArea`.
2. Even for placeholders that *are* loaded, `instructorIdsWithCourses` is built from a clipped 1,000-row course list, so most placeholders look like they have no active courses and get dropped from `relevantInstructors`.

Result: the page falls through to the "No courses found within 25 miles of City of Edinburgh" empty state, even though the data exists.

The empty state copy is also misleading — when the user searches a district where only placeholders live, the message reads as if no instructors were in radius, not that nothing got returned.

## Fix

In `src/pages/Courses.tsx` `fetchData` (around lines 755–766):

1. **Scope `public_instructors` to the relevant set instead of pulling all 5,800 rows.** Two parallel queries:
   - Real instructors with a home_postcode prefix matching the user's searched outward code (when known), plus any non-placeholders already in radius via cached coords.
   - Placeholder instructors whose `placeholder_district` equals the searched district (when known).
   When no postcode is set yet, load only real instructors with a published rate, paginating to lift the 1000 cap.
2. **Scope `instructor_courses` to the loaded instructor IDs**, `.in("instructor_id", loadedIds)`. This both fixes the cap and slashes payload size.
3. **Add an explicit `.range(0, 4999)`** on both queries as a safety belt so a future spike past 1k rows can't silently truncate again.
4. **Tighten the empty-state copy** in `src/pages/Courses.tsx` ~line 1848 so a district with only placeholder enquiries reads "No instructors in EH12 yet — register your interest" rather than the radius-based message.

## Verification

After the change, hitting `/courses?postcode=EH120AA` should:
- Load Daniel King and Ava Young (the two EH12 placeholders).
- Render their course cards (10/20/28/30/40-hour tiles) without the empty state.
- Keep the existing district fallback / availability behaviour intact for other postcodes.

I'll spot-check by reloading the route in the preview and confirming the cards appear.
