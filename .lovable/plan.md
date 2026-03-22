

## Plan: Remove Redundant Pricing Pages

### What's Redundant
- `/instructor-app/compare` — hardcoded feature comparison, fully superseded by `/compare`
- `/instructor-app/pricing` — plan cards with bullet features, duplicates `/compare` with less detail

### What to Keep
- `/compare` — the definitive database-driven matrix
- `/instructor/plans` — in-app plan switcher (different purpose)

### Changes

| File | Change |
|------|--------|
| `src/routes/instructorAppRoutes.tsx` | Replace `InstructorCompare` and `InstructorPricing` routes with redirects to `/compare` |
| `src/pages/instructor-app/InstructorCompare.tsx` | Delete file |
| `src/pages/instructor-app/InstructorPricing.tsx` | Delete file |
| Any files linking to `/instructor-app/pricing` or `/instructor-app/compare` | Update links to point to `/compare` |

### Notes
- `/instructor-app/plan/:slug` (plan detail page) stays — it's the signup flow for a specific plan
- All internal nav links (header, footer, CTAs) will be updated to `/compare`

