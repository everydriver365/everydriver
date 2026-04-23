
## Remove "Some live data is delayed" banner

Remove the `TileHealthBanner` from the instructor mobile app homepage so the amber warning no longer appears at the top.

### Change
- **File:** `src/pages/instructor/MobileHomepage.tsx` (or wherever `TileHealthBanner` is rendered on the mobile home)
- Remove the `<TileHealthBanner instructorId={...} />` usage and its import.

### Notes
- The `TileHealthBanner.tsx` component file itself will be left in place (unused) in case you want to re-enable it later.
- The small per-widget outage dots (e.g. inside `MessagesWidget`) are separate and will remain untouched unless you also want those removed — let me know.
