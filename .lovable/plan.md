# Search Page Improvements Plan

## Current Issues Found

1. **Broken "Course Type" filter** — the `<select>` has no `value` or `onChange` hooked up, so choosing 10/20/30/40 Hours or "Test in a Week" does nothing.
2. **Broken price-range buckets** — "Under £500", "£500-£1000", "Over £1000" are all `disabled` and non-functional.
3. **Mobile always shows grid cards** — the list view ( cleaner for scanning ) is desktop-only. On mobile users get flip cards which take up a lot of vertical space.
4. **No "no results" smart fallback** — when zero courses match, the page suggests widening radius but doesn't offer "next available date" or "nearest instructor regardless of date".

## Proposed Improvements

### 1. Fix Course Type Filter (functional)
- Wire the Course Type `<select>` to state and filter logic so users can narrow by 10/20/30/40 Hours or "Test in a Week".
- Add the state variable, update `filteredCourses` memo, and sync with URL params so a shared link preserves the course-type filter.

### 2. Fix Price-Range Buckets (functional)
- Enable the three disabled price-range options.
- Add a `priceRange` state ("any" | "under-500" | "500-1000" | "over-1000").
- Filter courses by `computedPrice` against these bounds. Sync to URL params.

### 3. Enable List View on Mobile
- Remove the `!isMobile` guard around the view toggle.
- Ensure `CourseRowCard` (already mobile-responsive from the last edit) renders cleanly in the mobile list branch too.
- Default mobile view can stay "grid" if desired, but users can switch.

### 4. Smart "No Results" Fallbacks
- When zero courses match the current date + postcode + filters, show a panel:
  - "Next available date for this area: [date]" — finds the earliest date with any courses.
  - "Show all instructors regardless of date" — toggle to view instructor profiles/courses without date restriction.
  - Keep the existing "Expand radius" CTA.

### 5. (Optional) Saved / Recent Postcodes
- Store last 3 searched postcodes in `localStorage`.
- Show them as quick-tap chips below the postcode input for repeat visitors.

---

## Technical Notes

- All changes are within `src/pages/Courses.tsx` and `src/components/courses/CourseRowCard.tsx` (already responsive).
- URL param sync uses existing `useSearchParams` pattern.
- No backend changes needed; filtering is client-side on already-fetched `coursesWithDistance`.
