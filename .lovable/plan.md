## Shrink the "Driving courses / Chapman's Driving School Courses" header on mobile

Lives in `src/components/courses/CourseSearchHeader.tsx` (lines 67–94). Title is 32px with `pt-5 pb-3 px-5` and `mb-5` — visually dominating the mobile viewport above the search card.

### Changes (one file, mobile-only)

`src/components/courses/CourseSearchHeader.tsx`:

- Section padding (line 68): `px-5 pt-5 pb-3` → `px-5 pt-3 pb-2 md:pt-5 md:pb-3`.
- Eyebrow margin (line 75): `mb-2` → `mb-1.5`.
- Title (lines 89–94): `text-[32px]` → `text-[22px] md:text-[32px]`, `mb-5` → `mb-3 md:mb-5`, drop the inline `marginTop: 8` (use `mt-1`).

No copy, color, or desktop sizing change. Search card and filter chips untouched.
