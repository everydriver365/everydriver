## Goal

When picking a practical driving test centre in the `DrivingTestQuickEdit` modal, default to centres near the pupil's home and let the instructor adjust postcode + radius. Closest centres show first with a distance label.

## Scope

Single file: `src/components/instructor/DrivingTestQuickEdit.tsx`. No DB changes (`test_centres` already has `lat`/`lng`; pupils already have `home_postcode`).

## UX

Inside the "Test centre" section, above the dropdown:

- **Postcode input** — prefilled with `pupil.home_postcode`, editable, uppercased.
- **Radius slider** — 5–50 miles, default 20, with a small "20 mi" label.
- Dropdown list:
  - Sorted ascending by distance from the postcode.
  - Each row shows `Name · Postcode · 4.2 mi`.
  - Centres outside the radius are hidden by default.
  - Footer row "Show all centres" toggles the radius filter off (useful when the pupil wants somewhere far).
  - If the postcode hasn't geocoded yet (or fails), fall back to the current alphabetical list with no distance label and a small inline "Couldn't locate postcode" hint — never hide centres.
- The currently-saved centre is always shown at the top, even if outside the radius, so it doesn't disappear.

## Technical

- Geocode the postcode client-side via the free `https://api.postcodes.io/postcodes/{pc}` endpoint (already used elsewhere in the project for pupil postcodes — no API key, no Google Maps call needed).
- Debounce postcode lookups (~400ms) and cache the last result in component state to avoid refetching on every keystroke.
- Haversine distance in miles (use the Imperial conversion `km * 0.621371`, per project Core rule).
- All sorting/filtering is in-memory on the already-loaded `centres` array — no extra Supabase query.
- No changes to the save payload; only `test_centre_id` is written, same as today.

## Out of scope

- Theory test centre picker (separate modal, separate table).
- Persisting the chosen radius.
- Map view / Google Places.
- Other components that render test centre lists.
