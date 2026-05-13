## Problem

On `/drive365/search`, switching to **List view** currently just renders the same `DynamicCourseCard` (vertical card) one-per-row. On the demo page (`DemoCourseResultsPremium`), List view uses a much nicer compact horizontal row — accent strip, hours pill, body with chips, price + CTAs on the right. The two should match.

## Plan

1. **Create `src/components/courses/CourseRowCard.tsx`** — a real-data version of the demo's `StandardCard`:
   - Left coloured accent strip (navy gradient)
   - Hours pill section using existing `course-hours-*.png` icons when applicable, otherwise a gradient hours block
   - Middle body: course title, transmission · instructor · location · distance row, start-date pill, Klarna/Clearpay split-payment pills (only when `instructor.klarna_enabled` / `clearpay_enabled`)
   - Right column: total price, "View & Book" navy button (links to existing course detail route), heart/save icon button
   - Props mirror what `DynamicCourseCard` already receives (instructor, hours, bookableDate, distance, isIntensive, etc.) plus computed `price`

2. **Wire it into `src/pages/Courses.tsx`** at line ~1463:
   - When `viewMode === "list"` (desktop only), render `<CourseRowCard ... />` instead of `<DynamicCourseCard ... />`
   - When `viewMode === "grid"`, keep the existing `DynamicCourseCard` 2-column grid unchanged
   - Mobile view (`isMobile` branch above) is untouched per the no-mobile-changes rule

3. **No backend / data shape changes.** Reuse the same `course` object already produced by the search query.

### Files touched
- `src/components/courses/CourseRowCard.tsx` (new)
- `src/pages/Courses.tsx` (swap component in the desktop list branch only)

### Out of scope
- Mobile layout
- Featured/sponsored card styling
- Grid view styling
