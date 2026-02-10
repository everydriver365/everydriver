

# Fix: Tracked Lessons Tab Showing No Data

## Problem

The `TrackedLessons` component (line 64 of `TrackedLessons.tsx`) uses a Supabase foreign key join syntax:

```
pupils!lesson_telematics_pupil_id_fkey(name)
```

There is no formal foreign key between `lesson_telematics` and `pupils`, so this query fails and returns no data. This is the exact same bug that was previously fixed in `RecentSessionsList.tsx`.

## Fix

**File: `src/components/instructor/TrackedLessons.tsx`**

Refactor the data fetch to use the same two-step pattern already working in `RecentSessionsList.tsx`:

1. Query `lesson_telematics` without the join (remove `pupils!...` from the select)
2. Collect unique `pupil_id` values from the results
3. Fetch matching pupil names from the `pupils` table in a second query
4. Map pupil names onto the lesson records

### Technical Changes

- **Remove** `pupils!lesson_telematics_pupil_id_fkey(name)` from the `.select()` call
- **Add** a second query to `pupils` table using `.in("id", pupilIds)`
- **Build** a `pupilMap` (id -> name) and use it when mapping results
- Error handling remains the same (silent fail, empty list)

This is a single-file fix with no other dependencies.

