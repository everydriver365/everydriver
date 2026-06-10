## What the data actually shows

For postcode `SO30 2TD` (district `SO30`) there ARE matches in the database:

- **2 real instructors** at `SO30 2TD` with active courses and geocoded coords:
  - Richard Chapman — 4 active courses, lat/lng populated
  - Ken D — 5 active courses, lat/lng populated
- **2 network placeholders** for `placeholder_district = 'SO30'` (Archie Lee, Charlie Knight) — no lat/lng (expected for placeholders).

The `public_instructors` view does expose `lat`, `lng`, `home_postcode`, `is_network_placeholder`, and `placeholder_district`, so the client has everything it needs to match these rows.

So this is not "no data" — it's a client-side filter/timing issue.

## Most likely cause

`src/pages/Courses.tsx` (lines 502–508):

```ts
useEffect(() => {
  if (initialPostcode && !hasSearchedFromUrl.current && !loading && instructors.length > 0) {
    hasSearchedFromUrl.current = true;
    handleSearch();
  }
}, [initialPostcode, loading, instructors.length]);
```

`handleSearch()` reads `postcode` from state (not `initialPostcode`), and we call it with no argument. The signature in `Courses.tsx` is `handleSearch(searchPostcode?: string)` and falls back to `postcode` state — that's fine because `postcode` is seeded from `initialPostcode` at mount.

But inside the URL flow, several second-order things can each independently produce the toast:

1. **Real instructors not matched because the geocode-postcode edge call hadn't finished before the radius filter ran.** `fetchData` kicks off `geocodePostcodes` for all instructor postcodes, but it doesn't block before `setLoading(false)` returns — instructors render before their coords are in `geoCache`. The auto-search effect waits for `instructors.length > 0`, not for coords. If `geoCache` is empty when `handleSearch` runs, `resolveInstructorCoords` falls back to `instructor.lat/lng` only — which IS present for the 2 real SO30 instructors via the view, so they should match. Unless the view shape returned to the client differs from what the type expects (the `Instructor` interface marks lat/lng as `number | null | undefined`).

2. **The radius default in the URL is `10` miles.** Both real SO30 2TD instructors are at the same postcode the user searched, so distance ≈ 0 — they pass. Placeholders are matched by `placeholder_district === 'SO30'` and don't need coords. So all 4 should be in `instructorsNearby`.

3. **Stale toast from an earlier search** — `handleSearch` shows the toast unconditionally after computing `instructorsNearby`. If `instructors` was momentarily empty (e.g. RLS error on `public_instructors` for the unauthenticated browser session), the toast fires once and never retries.

Console logs already show 20 queries in the route budget but no `public_instructors` error, so #3 is the leading candidate only if RLS silently returned 0 rows for some queries.

## Proposed plan (still in plan mode — no edits yet)

Two short diagnostic steps, then a targeted fix:

**Step 1 — confirm the actual cause (instrument once, read logs, then revert)**

In `useCourseDiscovery.ts` `handleSearch`, log:

```ts
console.log("[Courses search]", {
  cleanPostcode, district, location,
  totalInstructors: instructors.length,
  realCount: instructors.filter(i => !i.is_network_placeholder).length,
  withCoords: instructors.filter(i => i.lat != null && i.lng != null).length,
  matched: instructorsNearby.length,
  matchedReal: instructorsNearby.filter(i => !i.is_network_placeholder).length,
});
```

Reload `/courses?postcode=SO302TD`, read the line, then remove the log.

**Step 2 — fix based on what Step 1 shows**

- If `totalInstructors === 0` at search time → tighten the auto-search guard to also wait until at least one non-placeholder instructor row is present, and re-run `handleSearch` whenever `instructors` grows after the first auto-search.
- If `withCoords` is low → block `handleSearch` until `geocodePostcodes` for instructor postcodes has resolved (await it in the auto-search effect, or check `geoCache` size).
- If `matchedReal > 0` but the toast still says "no instructors nearby" → the toast condition is reading a stale closure; change it to compute from the fresh `instructorsNearby` length we just built (it already does, so this case is unlikely).
- Always: change the toast copy to suppress when `hasPlaceholderNearby` is true (we still have enquiry-only ADIs to show, so "no instructors nearby" is misleading).

**Step 3 — verify**

Reload `/courses?postcode=SO302TD` and confirm Richard Chapman + Ken D cards render and the toast no longer fires.

## What I will NOT change

- The `public_instructors` view (it already exposes the right columns).
- `React.memo` on `DynamicCourseCard`.
- Any business logic beyond the search-trigger timing and toast condition.

Want me to switch to build mode and run Step 1 (add the one diagnostic log, you reload, paste the line back)? Or jump straight to Step 2's "wait for coords + don't toast when placeholders exist" fix without the diagnostic?