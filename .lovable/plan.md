

## Apply Enhancements to Quick Actions Popover

Based on the previous suggestions, here are the changes to implement:

### 1. Add Haptic Feedback to Quick Actions
**File:** `src/components/instructor/QuickActionsPopoverMenu.tsx`
- Import `haptics` from `@/lib/haptics`
- Add `haptics.light()` on each action tap
- Add `haptics.medium()` when the popover opens

### 2. Add Search/Filter Bar
**File:** `src/components/instructor/QuickActionsPopoverMenu.tsx`
- Add a `useState` for search query
- Add a search `Input` at the top of the popover (sticky, above the ScrollArea)
- Filter `quickActions` by label match against the query
- Show "No results" when nothing matches
- Auto-focus the input when the popover opens
- Clear search on close

### 3. Customizable Quick Actions (Pin Favorites)
**File:** `src/components/instructor/QuickActionsPopoverMenu.tsx`
- Read pinned action IDs from `localStorage` (key: `pinned-quick-actions`)
- Sort pinned actions to the top of the list with a subtle "Pinned" divider
- Add a long-press or star icon on each action to toggle pinned state
- Persist changes back to `localStorage`

### 4. Pull-to-Refresh
Already implemented on the instructor mobile home — no changes needed.

### Summary of Changes
Only one file changes: `QuickActionsPopoverMenu.tsx` — adding haptics, a search input, and pinning logic with localStorage persistence.

