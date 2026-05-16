# Remove the "no instructors within 25 miles" banner

## What you see now
On `/courses?postcode=EH12...` there's an amber banner above the results that reads:
> No instructors found within 25 mi of EH12, Edinburgh. Showing wider results.

The EH12 mock instructors (Daniel King, Ava Young, etc.) are already in the database and the search logic already matches them by district. The banner is misleading because those mock instructors *are* showing up — the notice is left over from a real-instructor radius check.

## Change
In `src/pages/Courses.tsx`:

1. Delete the amber notice block (lines ~1502–1519) that renders when `showRadiusFallbackNotice` is true.
2. Stop setting `showRadiusFallbackNotice` / `usedFallback` in the search handler (lines ~654, ~668, ~705) and remove the related `useState` (line ~325) so no dead state remains.
3. Simplify the success toast (line ~707) to always read "Showing courses near {area}" — drop the "no instructors within X mi … wider results" variant.

No other logic changes. Mock instructors continue to render via the existing `is_network_placeholder` path.
