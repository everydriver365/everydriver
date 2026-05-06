## Goal

On `winchesterdrivingschool.co.uk/courses`, show Ken-D's courses and availability with **no postcode or radius filtering**. Optionally let visitors enter a postcode to see how far away the instructor is — but never use that postcode to hide results. Drive365 / DSM marketplace behaviour stays untouched.

## Approach

Reuse the existing `useCourseDiscovery` hook — it already supports an `instructorId` argument that scopes instructors, courses, working hours and date overrides to a single instructor. Compose it with the existing `SidebarCalendar`, `DynamicCourseCard` and `MobileCourseCard` components in a new dedicated page.

Distance is computed client-side from a one-shot geocode of the visitor's postcode against Ken-D's already-geocoded `home_postcode`. It's used only for display on the course cards — never to filter the list.

## Files

### Create `src/pages/WhitelabelCourses.tsx`
- Read `getWhitelabelConfig()` to get `instructorSlug` + `brandName`.
- Look up the instructor row by `app_slug` via Supabase to resolve the slug → instructor id.
- Call `useCourseDiscovery("all", instructorId)` to drive the calendar + course list.
- **Postcode input (display-only)**:
  - Compact `PostcodeAutocomplete` + "Show distance" button in the page header.
  - On submit, call the existing `geocode-postcode` edge function for both the visitor's postcode and Ken-D's `home_postcode`, compute haversine miles, store in local state.
  - Clear button resets the distance display. No effect on calendar dates or filtered courses.
  - Helper text under the field: "We don't filter by location — we travel to you. Enter a postcode to see how far we are."
- Layout:
  - Header band: "{brandName} — Courses" with the postcode field beneath the title.
  - Two-column on desktop: left = `SidebarCalendar`, right = courses for `selectedDate`.
  - Mobile = single-column list using the existing `MobileCourseCard` plus "Load more" pagination identical to `CourseGrid`.
- Pass the computed `distance` (in miles) into each `DynamicCourseCard` / `MobileCourseCard` via the existing `distance` prop they already render.
- Empty states:
  - Slug missing / instructor not found / inactive → friendly message.
  - No `selectedDate` after load → "No upcoming availability" card.
  - `selectedDate` but no courses → "No courses on this date" card.
- Wrapped in the standard `MainLayout` so the white-label header/footer/branding (already domain-aware) render automatically.
- `<Helmet>` title + description use `brandName`.

### Edit `src/routes/publicRoutes.tsx`
- Add `const WhitelabelCourses = lazy(() => import("@/pages/WhitelabelCourses"));`
- Replace the existing `/courses` route with a small wrapper that picks the page at render time:
  ```tsx
  <Route
    path="/courses"
    element={isWhitelabelDomain() ? <WhitelabelCourses /> : <Courses />}
  />
  ```
  (Importing `isWhitelabelDomain` from `@/lib/whitelabel`.)

### No changes
- `src/pages/Courses.tsx` — marketplace page is left intact.
- `src/hooks/useCourseDiscovery.ts` — already supports instructor scoping.
- `DynamicCourseCard` / `MobileCourseCard` — already render the `distance` prop.
- `DomainRouter.tsx` — current routing is correct; only the page rendered at `/courses` changes.
- Booking flow (`/book/:instructorId`) — already works on white-label domains.

## Why this is safe

- Zero changes to the marketplace search code path → no regression risk for Drive365 / DSM.
- White-label site renders the same booking + pupil-login flows it already does today.
- Postcode input is purely informational — there is no code path that can hide a course based on it.
- Adding more white-label domains in future just means appending to `WHITELABEL_CONFIGS` in `src/lib/whitelabel.ts`.

## Out of scope

- Persisting the entered postcode across sessions.
- Travel-time / drive-time estimates (distance only).
- Mobile layout changes to the marketplace `Courses.tsx` (per project rule).
