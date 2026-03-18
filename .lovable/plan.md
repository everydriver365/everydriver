

## The Waiting Room Tile — Missing from Alternative Layouts

**The Problem:** The Waiting Room promo tile only exists in the **default** layout branch of `InstructorMobileHome.tsx` (line 555). If you're using any other layout style (`schedule`/AppStyle, `lockscreen`, `clean`, `ios-native`, `compact`, or `bestmate`), it won't appear.

**The Fix:** Add the Waiting Room promo tile to all alternative layout views so it shows regardless of which home layout is active.

### Changes

1. **`AppStyleHomeView.tsx`** — Add the waiting room promo tile (the dark gradient card with coffee icon) below the tile grid, before the closing `</div>`.

2. **`LockScreenHomeView.tsx`** — Add the same promo tile in an appropriate spot.

3. **`CleanHomeView.tsx`** — Add the promo tile.

4. **`IOSNativeHomeView.tsx`**, **`CompactHomeView.tsx`**, **`BestMateHomeView.tsx`** — Add the promo tile to each.

For all views, the tile will be the same reusable block: the dark gradient card with the background image, coffee icon, "The Waiting Room" title, "Live Weekly" badge, and chevron — linking to `/instructor/waiting-room`.

To keep it DRY, I'll extract the tile into a small shared component (`WaitingRoomPromoTile.tsx`) and import it into each layout view.

