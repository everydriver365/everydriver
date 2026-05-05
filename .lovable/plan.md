## The bug

In `CustomizeFrequentlyUsedSheet` the local pinned-state is reset every time the parent re-renders, not just when the sheet opens:

```tsx
// CustomizeFrequentlyUsedSheet.tsx
useEffect(() => {
  if (open) {
    setPinnedIds(initialPinnedIds);   // ← runs every time initialPinnedIds reference changes
    setSelectedCategory("All");
  }
}, [open, initialPinnedIds]);
```

`initialPinnedIds` comes from `useInstructorPinnedTiles().pinnedIds`, which builds a brand-new array on every render of `QuickAccessSection`. The home re-renders constantly because of background-refreshing hooks (`useUnreadMessagesCount`, `usePendingJobsCount`, `useRealGapSlots`, `useInstructorPupilsPaymentSummary`, etc.).

Result: while the customize sheet is open, every background refetch resets the user's edits back to the saved list. When they tap Done, the order they're saving is the *original* list, so after closing the sheet "the icons don't change".

(There is also a smaller, related issue: when there are no pinned rows in DB, `pinnedIds` falls back to `DEFAULT_PINNED_TILE_IDS`, but for a brand-new user the optimistic update writes their new list correctly — so this fallback isn't the source of the bug.)

## Fix

Make the sheet's local state initialise once per open, and ignore later changes to `initialPinnedIds`:

1. In `src/components/instructor/quickAccess/CustomizeFrequentlyUsedSheet.tsx`:
   - Change the reset effect to depend only on `open` (not `initialPinnedIds`).
   - Snapshot `initialPinnedIds` in a ref, reading the current value when `open` flips to true.

```tsx
const initialRef = useRef(initialPinnedIds);
initialRef.current = initialPinnedIds;

useEffect(() => {
  if (open) {
    setPinnedIds(initialRef.current);
    setSelectedCategory("All");
  }
}, [open]);
```

That way: opening the sheet seeds local state with the latest pinned list; while it's open, parent re-renders no longer clobber the user's edits; closing + reopening picks up the freshly-saved list.

2. Apply the same one-shot pattern to `CustomizeTilesSheet.tsx` (used by `QuickAccessSwipeablePaged` on the legacy path) — same bug structure with `currentOrder`.

3. Sanity-check: the `QuickAccessSection` render path itself is correct — `tiles = pinnedIds.map(id => QUICK_ACCESS_TILES_BY_ID[id])` resolves icon/tone from the registry, so once the saved order is right, the icons update automatically. No changes needed there.

## Files touched

- `src/components/instructor/quickAccess/CustomizeFrequentlyUsedSheet.tsx`
- `src/components/instructor/quickAccess/CustomizeTilesSheet.tsx`

## QA after the fix

1. On `/instructor` mobile: open Quick access → Edit (Customize), drag to reorder, remove one, add another, tap Done. Confirm grid shows the new order/icons immediately and after refresh.
2. Open the sheet, leave it open ~30s while background queries refetch, then make edits and Done — edits must persist (this is the regression we're fixing).
3. Reset by removing all pins → defaults reappear.
