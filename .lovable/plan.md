## Add "Critical" section to instructor desktop sidebar

A new fixed-position section at the very top of `DashboardSidebar`, above Favorites and all category groups. Editable per instructor, persisted to DB + localStorage (same pattern as `sidebar_pinned`).

### Default items

Seeded once per instructor (first load only) with these routes:

1. Profile → `/instructor/settings/profile`
2. Schedule → `/instructor/schedule`
3. Availability (Working hours) → `/instructor/settings/working-hours`
4. Booking Flow (How pupils book) → `/instructor/settings/how-pupils-book`
5. Pupils → `/instructor/pupils`
6. Payments → `/instructor/pay`
7. Discounts → `/instructor/settings/discounts-packages`
8. Tests (Driving Tests) → `/instructor/test-results`

### Behaviour

- **Layout**: rendered above the existing "Pinned" block, with its own uppercase "CRITICAL" header (red accent dot to differentiate from grey "Pinned").
- **Reorder**: drag-and-drop within the Critical list, same HTML5 DnD as Favorites, with the existing "order saved" toast.
- **Add**: same pin button on every sidebar item — long-press or right-click on the pin shows a small menu "Add to Critical / Add to Favorites". Simplest: keep the pin icon for Favorites and add a small star icon (only visible on hover) that adds the item to Critical. Clicking the star on an item already in Critical removes it.
- **Remove**: hovering a Critical row shows an "x" on the right.
- **Hide section**: if the instructor empties Critical, the whole section disappears (no empty state).

### Persistence

- New JSONB column `instructors.sidebar_critical` (array of route paths).
- On first load for an instructor whose column is empty / null, seed with the 8 defaults above and write back. After that, only respect what's in the DB (so removals stick).
- localStorage mirror under `dsm.dashboard.sidebar.critical` as offline fallback (matches Favorites pattern).
- Updates write to both, then `toast.success("Critical order saved")` on drag-reorder.

### Files touched

- `supabase/migrations/<new>` — add `sidebar_critical jsonb default '[]'`.
- `src/components/instructor/dashboardV2/DashboardSidebar.tsx` — add state, load/save hooks, star toggle button, Critical render block above the Pinned block, drag handlers (reuse the existing pattern).

### Out of scope

- Mobile sidebar (per project rule: no mobile changes unless asked).
- Settings sidebar (separate component).
- No change to the existing Favorites / pin behaviour or its toast.
