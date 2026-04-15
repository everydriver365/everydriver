

## Consolidate All Settings onto One Searchable Page

### Current structure
Settings are split across two pages: `InstructorSettings.tsx` (category list with navigation) routes to `InstructorSettingsCategory.tsx` (individual category with collapsible tiles). The user must tap a category, then find the setting — two levels deep.

### What changes

**Merge everything into a single scrollable page** with all ~35 settings tiles visible, grouped by category headers. The existing search bar filters tiles in real time — non-matching tiles hide, matching ones auto-expand.

### Technical approach

**File: `src/pages/InstructorSettings.tsx`** — Major rewrite
1. Import all the settings components currently in `InstructorSettingsCategory.tsx` (profile editors, course managers, compliance tracker, etc.)
2. Remove the category navigation cards (the chevron list)
3. Render all tiles inline, grouped under category headers (e.g. "Profile & Identity", "Courses & Payments")
4. Reuse the existing `SettingsTile` collapsible pattern from `InstructorSettingsCategory.tsx`
5. Enhance search: filter the `IOSSearchBar` or `SettingsSearchBar` to show/hide tiles by matching title/description, and auto-open matching tiles
6. Keep quick toggles (visibility, Hey ED, feature toggles) at the top

**File: `src/pages/InstructorSettingsCategory.tsx`** — Keep for route compatibility
- Redirect `/instructor/settings/:categoryId` to `/instructor/settings` with `?open=` and `?category=` params so existing links/bookmarks still work

**Search behaviour:**
- Empty query: all tiles visible, all collapsed
- Typing: only matching tiles shown, auto-expanded
- Clear: reset to default view

### Structure on page
```text
┌─────────────────────────┐
│ Settings (large title)  │
│ [Search settings...]    │
│                         │
│ ── Quick Toggles ────── │
│ Listed on Website  [sw] │
│ Hey ED             [sw] │
│ Feature Toggles         │
│                         │
│ ── Profile & Identity ─ │
│ ▸ Profile               │
│ ▸ Vehicle & Quals       │
│ ▸ Images & Media        │
│                         │
│ ── Compliance ───────── │
│ ▸ Compliance & CPD      │
│ ▸ Test Centres          │
│ ▸ Terms & Conditions    │
│                         │
│ ... (all categories)    │
└─────────────────────────┘
```

### Files to edit
1. **`src/pages/InstructorSettings.tsx`** — Merge in all tile content from `InstructorSettingsCategory.tsx`, add search filtering
2. **`src/pages/InstructorSettingsCategory.tsx`** — Convert to a redirect to the main settings page
3. **`src/components/instructor/SettingsSearchBar.tsx`** — Update to support live filtering callback (return filtered IDs to parent) instead of only dropdown navigation

