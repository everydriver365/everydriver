## Fuel Finder — desktop "does not work" fix

### Root cause

Tested the `get-fuel-prices` edge function directly with a real instructor — it returns 10 stations correctly. So the backend is fine.

The "No fuel stations found within 15km" the desktop is showing is a misleading fallback that fires in two situations the UI doesn't currently distinguish:

1. **No `home_postcode` on the instructor** — edge function returns `200` with `{ stations: [], error: "No postcode configured" }`. `useFuelPrices` ignores the embedded `error` field, so the page just renders the generic empty state with no way to fix it.
2. **Postcode set but couldn't be geocoded** — same shape, same silent failure (`error: "Could not geocode postcode"`).

The session replay shows the user landing on the page with the generic empty-state message and the refresh button disabled — classic symptom of (1).

### Fix

**`src/hooks/useFuelPrices.ts`**
- When the edge function returns 200 with `data.error` and an empty `stations` array, surface that string via the hook's `error` state instead of falling through to "no results".

**`src/pages/InstructorFuel.tsx`**
- Replace the bare "No fuel stations found within 15km" empty state with a friendlier card that:
  - Detects `error === "No postcode configured"` and shows a "Set your home postcode" CTA linking to `/instructor/settings` (where `home_postcode` is edited).
  - For the geocode-failure case, shows "We couldn't locate that postcode — please check it" with the same CTA.
  - For genuine empty results (postcode OK, no stations within 15km), keeps the existing copy.
- Keep the existing error block (used for network failures from `fnError`) unchanged.

No edge-function, schema or mobile-layout changes. Mobile view is untouched per project rule.

### Out of scope
- Increasing the 15 km radius (separate request).
- Reworking the desktop layout of the Fuel Finder.
