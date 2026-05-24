## Goal

Keep the 5,796 "Drive365 Network" placeholder instructors in the database, but **segregate them in the admin portal** so they no longer pollute the main instructor list. They get their own dedicated section: **"Drive365 Network Instructors"**.

## Identification rule

A row is a Network placeholder iff:
- `auth_user_id IS NULL`, **and**
- `app_slug LIKE 'network-%'`

This is exact, stable, and unique to the seeded set (5,796 rows match). Real placeholders like `home@dufosse.co.uk` ("Martin B (adi assigns)") have no `network-` slug and are unaffected.

### 1. Schema marker (one tiny migration)

Add a generated/derived flag so every admin query can filter cheaply and consistently:

```sql
ALTER TABLE public.instructors
  ADD COLUMN is_network_placeholder boolean
    GENERATED ALWAYS AS (auth_user_id IS NULL AND app_slug LIKE 'network-%') STORED;

CREATE INDEX idx_instructors_network_placeholder
  ON public.instructors (is_network_placeholder)
  WHERE is_network_placeholder = true;
```

No data is touched. The flag auto-recomputes on insert/update — future network seeds inherit it automatically.

### 2. Admin UI changes

**Main instructor list** (`InstructorList`, `InstructorManager`, `AdminCommandCenter`, `InstructorLeaderboard`, `AdminLiveMapView`, `MiniWebsitesManager`, `AdminBookingPagesManager`, `AdminWebsiteManager`, `AdminInstructorPayouts`, etc.):
- Add `.eq('is_network_placeholder', false)` to every `from('instructors')` select used by these surfaces.
- Real instructor count drops back to the true number (currently 5 real + 2 placeholders without `auth_user_id` that aren't network).

**New section: "Drive365 Network Instructors"**
- New route: `/admin/network-instructors`
- New page: `src/pages/admin/NetworkInstructors.tsx`
- New component: `src/components/admin/NetworkInstructorsManager.tsx`
- Lists only rows where `is_network_placeholder = true`, paginated (50/page; 5,796 total).
- Columns: name, postcode area (derived from `home_postcode`), slug, created_at.
- Filters: postcode prefix (e.g. "AB", "SW"), search by name.
- Bulk actions: none initially — read-only browse + per-row "Promote to real instructor" (clears the network slug & opens the standard edit form).
- Add nav entry in `AdminSidebar` / `AdminDesktopSidebar` under "Instructors" group, badge showing the network count.

### 3. Public/search surfaces

Out of scope per the user's request — they stay visible in public course/postcode search exactly as today. Only the **admin portal** is segregated.

### 4. Verification

After migration:
- Admin "Instructors" tab shows ~5 rows (real auth-linked + non-network placeholders).
- New "Drive365 Network Instructors" tab shows 5,796 rows, paginated.
- Public mini-site / course search unchanged.

### 5. Memory update

Add a memory note documenting the `is_network_placeholder` flag and the rule that **every admin instructor query must filter it out** unless explicitly in the Network Instructors view.

## Files touched (estimate ~12)

- 1 migration
- 1 new route file (`src/routes/adminRoutes.tsx`)
- 1 new page + 1 new component
- ~8 existing admin components: append `.eq('is_network_placeholder', false)` to their instructor queries
- 1 sidebar nav entry
- 1 memory file
