## What is broken

The Winchester courses page is trying to load Ken D through `public.instructors` as a logged-out visitor. That request fails with:

```text
401 permission denied for table instructors
```

The database already has a safe public view called `public_instructors`, but the learner/course pages still query the locked-down base `instructors` table in several places. Because the instructor record never loads, the app has no working hours, no available dates, and no course cards to show.

## Fix plan

### 1. Use the safe public instructor view for learner/course pages

Update public course-loading code to query `public_instructors` instead of `instructors`:

- `src/hooks/useCourseDiscovery.ts`
  - This powers the Winchester whitelabel course calendar.
  - Switch the public instructor query to `public_instructors`.
  - Keep filtering by Ken D’s resolved instructor id when on the Winchester domain.

- `src/pages/WhitelabelCourses.tsx`
  - Resolve `ken-d` from `public_instructors` instead of `instructors`.
  - Keep using `available_from` for the booking-from message.

- `src/pages/Courses.tsx`
  - Switch learner course search from `instructors` to `public_instructors`.
  - Preserve postcode/radius filtering and whitelabel scoping.

- `src/hooks/useFeaturedCourses.ts`
  - Switch public featured course cards to `public_instructors` so Winchester homepage featured courses can load too.

- `src/pages/Index.tsx`
  - Switch the Winchester homepage slug lookup to `public_instructors`.

### 2. Handle fields that are not in the public view

Some card price calculations optionally use `school_skim_amount`, which is not exposed in `public_instructors`. I will make those calculations tolerate the missing field safely by treating it as `0` on public views, without exposing the private base instructor record.

### 3. Keep private instructor/admin screens unchanged

Authenticated instructor/admin pages will continue querying `instructors`, because they need full profile/settings data and are protected by existing authenticated RLS policies.

### 4. Verify behaviour

After implementation, verify:

- `https://www.winchesterdrivingschool.co.uk/courses` no longer logs the `401 permission denied for table instructors` error.
- Ken D’s available days show in the calendar from his `available_from` date onward.
- Selecting an available date lists his active course packages.
- Postcode/radius filtering still narrows results correctly when a learner searches by postcode.
- Main learner course search still loads public instructors without exposing private instructor fields.