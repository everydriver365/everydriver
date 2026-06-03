## Scope

Visual-only redesign of the search bar that appears on `/booking/chapmans`. Logic (postcode autocomplete, radius/transmission selects, search trigger, dropdown behaviour) stays untouched.

## Files involved

Confirmed exact component rendering the search bar:

- `src/components/courses/CourseSearchHeader.tsx` — the search bar component (used by the `Courses` page, which `PublicBookingPortal` embeds for `/booking/chapmans`).
- `src/pages/Courses.tsx` — passes props through; only change is forwarding a new `variant` prop.
- `src/pages/PublicBookingPortal.tsx` — sets `variant="chapmans"` on `<Courses>` only when `slug === "chapmans"`.

No other files modified. No other pages affected. The default (`/courses`, other booking pages) keeps the current design.

## Approach

1. Add an optional `variant?: "default" | "chapmans"` prop to `CourseSearchHeader` (default `"default"`).
2. When `variant === "chapmans"`, render a new redesigned bar (spec below) instead of the current unified form. Reuse the existing `PostcodeAutocomplete`, `select`s for radius/transmission, and the same `handleSearch`/`onSearch` wiring — only markup and styles change. Eyebrow, title and the filter pill row remain unchanged.
3. Thread the prop through `Courses` (`variant?: ...` added to `CoursesProps`, forwarded to `CourseSearchHeader`).
4. In `PublicBookingPortal`, pass `variant={slug === "chapmans" ? "chapmans" : undefined}` to `<Courses>`.

## Redesigned bar spec (chapmans variant)

Container (the `<form>`):
- `background: #fff`, `border-radius: 14px`, `padding: 16px`
- `box-shadow: 0 2px 12px rgba(0,0,0,0.08)`, no border
- `display: flex; align-items: center; gap: 10px`

Three detached field boxes (Postcode flex 1.5, Radius flex 1, Transmission flex 1):
- `background: #F9FAFB`, `border: 1px solid #E5E7EB`, `border-radius: 8px`
- `padding: 10px 14px`, `display: flex; flex-direction: column; gap: 2px`
- Label: 9px / weight 700 / `#9CA3AF` / uppercase / `letter-spacing: 0.8px`
- Value row: 13px / weight 500 / `#0A0E27`
  - Postcode: `MapPin` icon (11px, `#9CA3AF`) left of the existing `PostcodeAutocomplete` input (input restyled to 13px/500, transparent, no border, no ring)
  - Radius: existing `<select>` (13px/500, transparent, appearance-none) with `ChevronDown` (11px, `#9CA3AF`) on the right
  - Transmission: same pattern as Radius

Search button:
- `background: #E8641A`, `color: #fff`, no border, `border-radius: 8px`
- `padding: 12px 28px`, `font-size: 13px`, `font-weight: 700`
- `display: flex; align-items: center; gap: 6px; flex-shrink: 0`
- `Search` icon (13px, white stroke) left of "Search"; `Loader2` swap kept while `isSearching`
- Click submits the form → existing `handleSearch()` → existing `onSearch` prop

## Constraints honoured

- Logic untouched: same state, same handlers, same `PostcodeAutocomplete`, same `<select>` elements and option values.
- Values pulled from existing state (`postcode`, `radius`, `transmission`) via existing props — no hardcoding.
- Filter tabs, hero, and any other component untouched (filter row continues to render below as today).
- Scoped to chapmans only via the `variant` prop gated on `slug === "chapmans"` in `PublicBookingPortal`; the global `/courses` page keeps its current bar.
- Light mode only; inline styles using literal hex values per the spec (matches the existing inline-style pattern in this file).
