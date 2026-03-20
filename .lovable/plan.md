

## Plan: Replace Radius Dropdown with Slider on Course Search

### Change
In `src/components/courses/CourseSearchHeader.tsx`, replace the `<select>` dropdown for radius with a `<Slider>` component showing the current value (e.g. "10 miles") and allowing selection from 5–50 miles.

### Details
- Remove the `<select>` element for radius
- Add a `Slider` (from `@/components/ui/slider`) with `min={5}`, `max={50}`, `step={5}`
- Display the current value as a label next to/above the slider (e.g. "15 miles")
- Style to fit inline with the existing search bar row on desktop, and stack naturally on mobile
- Convert `radius` from string to number for the slider, converting back via `setRadius(String(value))`

### File Modified
- `src/components/courses/CourseSearchHeader.tsx` — swap select for Slider + label

