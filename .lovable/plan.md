## Fix

On Chapman's mobile, when **Grid** is selected, render the same `DynamicCourseCard` flip cards Drive365 uses on mobile — in a single column — instead of my compact 2-up tile.

### Changes in `src/components/courses/ChapmansMobileResults.tsx`

1. When `viewMode === "grid"`, swap the current compact-tile branch for the Drive365 mobile cards: map `courses` and render `<DynamicCourseCard ... />` per item, wrapped in `flex flex-col gap-4` with `padding: 0 16px`.
2. Pass the same props Drive365 passes on mobile (`Courses.tsx` lines ~2001–2029): `instructor`, `hours`, `nextAvailable`, `courseImageUrl`, `isPopular`, `availableFrom`, `distance`, `features`, `isIntensive`, `discountedPrice`, offer fields, `customFeatures`, `areaName`, `effectiveHourlyRate`, `learnerPostcode`.
3. When `viewMode === "list"`, keep the existing Chapman's compact list card unchanged.
4. Revert the 2-column CSS grid wrapper and the compact in-card branches (`isGrid` flags, stacked price, hidden row 3, etc.). The list path becomes the only `isGrid === false` path again.
5. Toggle remains functional — list = Chapman's compact rows, grid = Drive365-style flip cards. No data, pricing, or filter logic changes. Desktop and non-Chapman's flows untouched.

### Note

`learnerPostcode` and `areaCache` are owned by `Courses.tsx`. `searchedPostcode` is not currently passed into `ChapmansMobileResults`; `areaName` already is (per-course). To pass `learnerPostcode` cleanly, add an optional `learnerPostcode?: string | null` prop to `ChapmansMobileResults` and forward it from `Courses.tsx` (single line). No other consumers affected.