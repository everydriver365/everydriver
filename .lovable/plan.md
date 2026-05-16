# Make postcode search actually work on `/test-swap/browse`

## Why it doesn't work today

- `handleSearch` calls `browse_public_test_swaps` with all filters null. That RPC has no postcode/radius params.
- `test_centres.lat` / `lng` columns exist but are NULL for all 314 active rows — so even a new RPC can't compute distance yet.
- `public_test_swap_signups` always carries `current_centre_id`, so once centres have coords, every swap inherits its centre's location.

## Approach

Server-side filtering with haversine in Postgres. Cleanest and accurate; no per-card lookups in the browser.

### 1. Backfill centre coordinates (one-time)

Create a small edge function `backfill-test-centre-coords` that:
- Selects all `test_centres` where `lat IS NULL AND postcode IS NOT NULL`.
- Calls `https://api.postcodes.io/postcodes` (free, no auth, bulk up to 100 at a time) with their postcodes.
- Writes `lat`/`lng` back via the service role.
- Returns counts (`updated`, `skipped`, `failed`).

I'll invoke it once after deploy. Centres without a postcode (or invalid ones) stay NULL and are simply excluded from radius results.

### 2. New RPC: `browse_public_test_swaps_by_postcode`

```sql
browse_public_test_swaps_by_postcode(
  p_lat       numeric DEFAULT NULL,
  p_lng       numeric DEFAULT NULL,
  p_radius_mi numeric DEFAULT NULL,
  p_limit     integer DEFAULT 100
)
RETURNS TABLE (
  ... existing columns ...,
  distance_miles numeric  -- NULL when no postcode supplied
)
```

Behaviour:
- If `p_lat`/`p_lng` is NULL → returns all upcoming pending swaps, soonest first (current behaviour), `distance_miles = NULL`.
- If supplied → joins `test_centres`, computes haversine miles, filters `distance <= p_radius_mi` when radius given, orders by `distance_miles ASC, current_test_date ASC`. Swaps whose centre has no coords are excluded only when a radius search is active.
- `STABLE SECURITY DEFINER`, `search_path = public`, same row gating as today (`status='pending'`, `has_test_booked=true`, `current_test_date >= CURRENT_DATE`).

Keep the existing `browse_public_test_swaps` RPC in place so nothing else breaks.

### 3. Client wiring (`src/pages/TestSwapBrowse.tsx`)

- On "Search" (or Enter): if `postcode.trim()` non-empty, geocode via `https://api.postcodes.io/postcodes/{postcode}` (free, CORS-enabled, no key). Cache the last lookup in component state to avoid re-geocoding the same postcode.
- Call the new RPC with `p_lat`, `p_lng`, `p_radius_mi: parseInt(radius)`. Empty postcode → call with all nulls.
- Map returned `distance_miles` onto each `SwapResult.distanceMiles` (formatted to 1 decimal). Group-level `distanceMiles` becomes the minimum distance across the group's swaps.
- Invalid postcode → toast "We couldn't find that postcode" and don't run the search.
- Loading state already exists; reuse it across geocode + RPC.

The existing UI ("X mi away", distance pill on cards, summary line) lights up automatically once `distanceMiles` is non-null.

### 4. Edge cases

- Postcode normalisation: uppercase + strip spaces before geocoding; postcodes.io tolerates both.
- Radius default stays `10`. Spec options stay 5/10/15/20.
- Centres with NULL coords: when no postcode search, included as today; when radius search, silently excluded (no "unknown distance" group).
- `localStorage.setItem("test_swap_browse_postcode", postcode)` so the postcode persists across visits (minor nicety — happy to skip if you'd rather not).

## Files

- **New migration** — adds `browse_public_test_swaps_by_postcode` function.
- **New edge function** — `supabase/functions/backfill-test-centre-coords/index.ts` (one-shot; I'll invoke it after deploy and report counts).
- **Edit** — `src/pages/TestSwapBrowse.tsx`: real `handleSearch` (geocode + new RPC + map distance), invalid-postcode toast.

## Out of scope

- No UI redesign — visual layer stays exactly as shipped.
- No changes to register/matches/home flows.
- No filtering by transmission/date (those weren't in the new spec).
