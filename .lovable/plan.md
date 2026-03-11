

## Plan: Update Ken D Course Search to Match Drive365 Style

The current Ken D courses page (`/i/ken-d/courses`) uses a basic card layout with simple images, prices, and feature lists. The Drive365 main site uses `DynamicCourseCard` (desktop flip cards) and `MobileCourseCard` (accordion cards) with richer details like instructor avatars, transmission badges, payment badges, date boxes, and intensity labels.

### What Changes

**File: `src/pages/mini-website/MiniWebsiteCourses.tsx`**

Replace the custom course card grid (lines ~421-490) with the existing `DynamicCourseCard` (desktop) and `MobileCourseCard` (mobile) components, passing Ken D's instructor data and course details.

Key changes:
1. **Import** `DynamicCourseCard`, `MobileCourseCard`, `useIsMobile`, and `CompactPaymentBadges`
2. **Build course data** in the format expected by these components - map each `filteredCourses` entry to include the instructor object shape, template image, features, intensity flag, etc.
3. **Desktop**: Render a 2-column grid of `DynamicCourseCard` with flip-on-hover behavior, date box in brand colour, transmission badge, payment options
4. **Mobile**: Render `MobileCourseCard` accordion cards with course badge images, expandable details, instructor bio, and payment badges
5. **Correct pricing**: Include `school_skim_amount` in price calculation (matching Drive365 logic)
6. **Use template images**: Fall back to `course_templates.default_image_url` when instructor hasn't set a custom image
7. **Pass `nextAvailable`**: Use `selectedDate` or first available date as the bookable date

This reuses the exact same card components as Drive365, ensuring visual consistency while showing only Ken D's courses.

### Technical Details

- The instructor object needs reshaping to match `DynamicCourseCardProps.instructor` (add `car_make`, `car_model`, `home_address` fields)
- `MobileCourseCard` expects a `course` object with `bookableDate`, `distance`, `isPremium`, etc.
- Both components handle their own navigation to `/book/:instructorId`
- No database changes needed - all data is already fetched

