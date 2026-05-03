## Goal
Add a real "Edit" button next to the Quick Actions title on the instructor mobile home page that opens a dedicated screen where the user can:
- Reorder the quick action rows
- Show / hide individual rows
- Save changes (persisted) or cancel

The 4 current rows on the home page are: **Job Offers, Messages, Take Payment, Pupils**.

## Why this is needed
The current `EveryInstructorHome.tsx` Quick Actions block is hard-coded — there is no Edit control wired up. Any "Edit" you're seeing is the Lovable visual-edit overlay, not a real feature, which is why it lands you on Settings.

## What will change

### 1. Home page — add real Edit button
**File:** `src/pages/EveryInstructorHome.tsx`
- Add an "Edit" text button (iOS blue `#007AFF`, 15px semibold) on the right side of the Quick Actions title row.
- Tapping it navigates to `/every-instructor/quick-actions/edit`.
- Read the saved preference (order + hidden ids) from `localStorage` (`instructor_home_quick_actions_v1`) and render the rows in that order, skipping hidden ones. If nothing is stored, fall back to the current default order.

### 2. New Edit screen
**New file:** `src/pages/EveryInstructorQuickActionsEdit.tsx`
- Mobile screen wrapped in `EveryInstructorLayout`.
- Header: back chevron, title "Edit Quick Actions", and a primary **Save** button (top-right, disabled until changes are made).
- Body: a single grouped iOS-style card listing all 4 quick actions, each row with:
  - Drag handle (left) to reorder (using `framer-motion` Reorder, already in deps)
  - Icon + label
  - Toggle switch (right) to show/hide
- Footer hint text: "Tap and drag to reorder. Use the toggle to hide an action."
- **Save** writes the new order + hidden list to `localStorage` and navigates back to `/every-instructor`.
- **Back** without saving discards changes (with a confirm if unsaved).

### 3. Route registration
**File:** `src/routes/everyInstructorRoutes.tsx`
- Register `/every-instructor/quick-actions/edit` → `EveryInstructorQuickActionsEdit` (lazy-loaded to match siblings).

### 4. Shared helper
**New file:** `src/lib/quickActionsPrefs.ts`
- Tiny module exporting:
  - `DEFAULT_QUICK_ACTIONS` (the 4 ids in order)
  - `loadQuickActionsPrefs()` → `{ order: string[]; hidden: string[] }`
  - `saveQuickActionsPrefs(prefs)`
- Used by both the home page and the edit screen so the contract stays in one place.

## Out of scope
- No DB / Supabase changes — preferences live in `localStorage` only (fast, no schema work, survives reloads on the same device). Can be promoted to a Supabase table later if cross-device sync is needed.
- Existing functionality, routes, business logic, and design tokens stay unchanged. Radii follow the established 12px card / 999px pill scale.
- The legacy `QuickActionTiles.tsx` component (different screen) is not touched.

## Acceptance
- "Edit" appears next to the Quick Actions title on the home page.
- Tapping it opens the new screen (no longer goes to Settings).
- User can reorder and hide/show rows, then tap Save.
- Returning to home reflects the new order and hides any disabled rows.
- Reload of the app preserves the saved layout.