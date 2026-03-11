

## Plan: Make Mini-Website Course Page Identical to Drive365

The mini-website courses page is missing the search header (postcode search box, radius selector, filters) that the main Drive365 `/courses` page has. The main page also uses iOS-style segmented controls for transmission/sort instead of the basic buttons in `CourseGrid`. The fix is to replicate the Drive365 layout exactly in `MiniWebsiteCourses.tsx`.

### Changes to `src/pages/mini-website/MiniWebsiteCourses.tsx`

1. **Remove the custom hero section** (the coloured banner with "Find Your Perfect Course") — replace it with the same search header as Drive365's `Courses.tsx` (lines 846-948): postcode autocomplete, radius dropdown, search button, and expandable filters.

2. **Destructure additional fields from `useCourseDiscovery`** that are already returned but not used: `postcode`, `setPostcode`, `radius`, `setRadius`, `transmission`, `setTransmission`, `isSearching`, `handleSearch`, `searchedPostcode`, `searchedAreaName`, `clearSearch`.

3. **Replace the `CourseGrid` component** with the inline course rendering from Drive365 (lines 1100-1267) which includes:
   - iOS-style segmented pill controls for transmission filter (All/Manual/Automatic)
   - iOS-style segmented pill controls for sort (Soonest/Nearest/Price)
   - Location display banner with clear button
   - `DynamicCourseCard` for both mobile and desktop (matching Drive365's current approach)
   - Load more button on mobile

4. **Remove the "Instructors Filter" sidebar tile** since mini-sites show only one instructor — keep just the calendar and contact CTA.

5. **Continue overriding `home_address`/`home_postcode`** to "Winchester" on course data for Ken D's slug.

### Technical Notes
- All search/filter state already exists in `useCourseDiscovery` hook — just needs destructuring
- The `PostcodeAutocomplete` component is already imported on Drive365; will need importing here
- `useIsMobile` hook needed for responsive card rendering
- No database changes required

