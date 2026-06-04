## Goal
Chapmans mobile (`/booking/chapmans`, ≤768px) course cards must show **exactly the same data** as the Drive365 desktop course cards (`DynamicCourseCard`) for the same `filteredCourses` row. No re-derivation, no extra skim, no synthetic titles.

## Root cause
`src/pages/Courses.tsx` (≈ lines 1730–1756) builds a different shape for `ChapmansMobileResults` than it does for the rest of the page. `ChapmansMobileResults` then derives the title and "Intensive/Semi/Weekly" label from `hours` alone. As a result:

- Price = `hours × rate + school_skim_amount` (Drive365 uses just `hours × effectiveHourlyRate`)
- Discount ignores `offerActive` / `offer_starts_at` / `offer_ends_at` / `offer_percent_off`
- Course name is replaced by `"{hours}hr {type}"` instead of the DB `course_name`
- Type label is guessed from hours instead of the DB `isIntensive` flag

## Changes

### 1. `src/pages/Courses.tsx` — pass the full course row
Replace the custom mapper in the `<ChapmansMobileResults courses={…}>` block with the same fields the rest of the page already has on `filteredCourses[i]`. Forward the whole `CourseWithInstructor` plus `effectiveHourlyRate` and `areaName`, just like `DynamicCourseCard` receives:

```ts
courses={filteredCourses.slice(0, mobileVisibleCount).map((c) => ({
  ...c,
  effectiveHourlyRate: resolvedRateFor(c.instructor),
  areaName: areaCache[c.instructor.home_postcode?.replace(/\s+/g, "").toUpperCase()] || null,
}))}
```

Remove the `c.hours * rate + skim` calculation entirely.

### 2. `src/components/courses/ChapmansMobileResults.tsx` — consume the same shape
- Update `ChapmansCourse` to mirror `CourseWithInstructor` (add `courseImageUrl`, `isPopular`, `features`, `customFeatures`, `offerActive`, `offerLabel`, `offerPercentOff`, `offerStartsAt`, `offerEndsAt`, `effectiveHourlyRate`, `areaName`, plus the course name when we add it — see step 3).
- Compute price the **same way as `DynamicCourseCard`**:
  - `hourlyRate = effectiveHourlyRate && >0 ? effectiveHourlyRate : instructor.hourly_rate`
  - `basePrice = hourlyRate * hours`
  - `finalPrice = computeOfferStatus(basePrice, { offer_active, offer_label, offer_percent_off, offer_starts_at, offer_ends_at, discounted_price }).finalPrice`
  - Show strike-through `basePrice` when `isLive`.
  - **Do not add `school_skim_amount`** — the desktop card doesn't, and adding it makes mobile read higher.
- Replace the synthetic title `"{hours}hr {type}"` with the actual `course_name` coming from the row (falling back to template name as the desktop pipeline already does upstream).
- Replace the hours-based `courseTypeLabel` with the DB `isIntensive` flag (Intensive vs Course), matching desktop wording.
- Use `areaName` + `distance` for the location line instead of just distance.

### 3. `src/pages/Courses.tsx` — expose `courseName` on `CourseWithInstructor`
`filteredCourses` is built from `instructor_courses` + `course_templates` but the current `CourseWithInstructor` type doesn't carry `course_name`. Add `courseName: string | null` to the interface and populate it where filteredCourses is assembled (same precedence the edge function uses: `instructor_courses.course_name ?? course_templates.course_name ?? "{hours} Hour Course"`). Desktop cards already have access via the template lookup, mobile currently does not — this is what forces the synthetic title.

## Out of scope
- No design / layout changes to the mobile card.
- No changes to desktop, search, filtering, sorting, or data fetching.
- No DB or edge function changes.

## Verification
- Pick one instructor course on `/booking/chapmans` mobile, then compare price, title, and Intensive/Course label against the same course on the Drive365 desktop courses page — they must match to the penny and to the word.
- A course with an active discount shows the same final price + strike-through on both surfaces.
- A course with `school_skim_amount > 0` shows the same price on both (i.e. mobile price drops vs current bug).
