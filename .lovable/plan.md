# Fix "99" on Tests tile — purge legacy scraped data from UI

## Root cause

The Tests tile badge reads `useTestSwapNotifications`, which sums three counts. One of them queries `test_slot_reservations` where `status = 'scraped_match'`. The database currently holds **98 such rows** (left over from the retired external scraper), plus 1 genuine swap match → badge shows **99** (capped visually as "9+", but the underlying number is 99 and the expand panel / action lists still expose them).

The same legacy source is read in two more places, which contradicts the new "no external scraping" banner on the Available tab:
- `src/components/test-requests/MatchedSlotsList.tsx` — Available tab list
- `src/hooks/useTestActionItems.ts` — action items feed

## Plan

Frontend-only change. No DB writes, no schema change. We simply stop reading the deprecated `scraped_match` rows anywhere in the instructor UI.

### 1. `src/hooks/useTestSwapNotifications.ts`
- Remove the `test_slot_reservations` / `scraped_match` count block.
- Remove its realtime subscription.
- Return only `pendingOffers + matchingTests`.

### 2. `src/components/test-requests/MatchedSlotsList.tsx`
- Remove the `scraped_match` query branch so the Available tab shows **only** swap-system `have_test` listings at the instructor's watched centres — matching the banner's promise.

### 3. `src/hooks/useTestActionItems.ts`
- Drop the `scrapedRes` query and the `"scraped"` kind from the merged list. Keep only pending swap offers.

### 4. (Optional, ask user) Database cleanup
- Leave the 98 legacy rows in `test_slot_reservations` untouched (they are no longer read by the UI), **or** issue a one-off migration to delete/archive them. Recommend leaving them for now and only purging if the user confirms — that avoids any risk to historical/admin views (`AdminScrapedMatchesPanel` still uses them).

## Expected result

- Tests tile badge drops to the real swap-only count (currently 1 in prod).
- Available tab content matches its banner — swap data only.
- Admin panel that intentionally inspects scraped legacy rows is unaffected.
