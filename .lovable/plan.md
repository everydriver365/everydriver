

## Plan: School Portal Feature Gating & UI Polish

### Problem
The admin can toggle `enabled_features` per school via the Admin School Manager, but the school portal **ignores these flags entirely** — all 24 sidebar items always appear. Additionally, a few UI/navigation inconsistencies need tidying up.

### Issues Identified

1. **Feature gating not enforced** — `SchoolLayout` renders all sidebar items regardless of `enabled_features`. Admin toggles have no effect on the school portal.
2. **`useSchoolData` doesn't expose `enabled_features`** — the `SchoolRecord` interface is missing the field, so it's never available to the layout.
3. **Admin feature toggle list is incomplete** — `AdminSchoolManager` only has 11 toggleable features, but the school portal has 24 sections. Missing: enquiries, messages, compliance, live-map, revenue-analytics, leaderboard, discount-codes, campaigns, booking-pages, pupils, bookings, instructors, payments, dashboard.
4. **"Booking Page" vs "Booking Pages" confusion** — both appear in Settings. "Booking Page" is the school's own page config; "Booking Pages" is the multi-page manager. Labels could be clearer.

### What to Fix

**1. Add `enabled_features` to `SchoolRecord` and `useSchoolData`**
- Add the field to the interface
- Pass it through to `SchoolLayout`

**2. Filter sidebar items in `SchoolLayout` based on `enabled_features`**
- Accept `enabledFeatures` prop
- Before rendering, filter out items where the feature is disabled
- Core items (dashboard, profile) are always visible and cannot be disabled

**3. Expand admin feature toggle list in `AdminSchoolManager`**
- Add all gatable sections to `FEATURE_DEFS`: enquiries, messages, compliance, live-map, revenue-analytics, leaderboard, discount-codes, campaigns, booking-pages, pupils, bookings, payments, instructors
- Group them visually to match the school sidebar structure

**4. Rename "Booking Page" → "School Page" in sidebar**
- Disambiguate from "Booking Pages" (the multi-page manager)

### Files to Modify

- **`src/hooks/useSchoolData.ts`** — add `enabled_features` to `SchoolRecord`, expose it from the hook
- **`src/components/school/SchoolLayout.tsx`** — accept `enabledFeatures` prop, filter sidebar items, always show dashboard + profile
- **`src/pages/SchoolPortal.tsx`** — pass `school.enabled_features` to `SchoolLayout`
- **`src/pages/DemoSchoolPortal.tsx`** — pass demo features (all enabled) to `SchoolLayout`
- **`src/components/admin/AdminSchoolManager.tsx`** — expand `FEATURE_DEFS` to cover all 24 school sections with appropriate icons and grouping

### Technical Notes
- No database migration needed — `enabled_features` column already exists with sensible defaults
- Items not listed in `enabled_features` default to enabled (backwards compatible)
- Dashboard and School Profile are always shown regardless of flags

