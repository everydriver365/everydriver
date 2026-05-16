# Backfill remaining 35 test-centre coordinates

## What I found

All 35 centres without `lat`/`lng` already have plausible UK postcodes in `test_centres.postcode` (e.g. `AB11 5FH`, `CT16 3PH`). The `address` column rarely contains a postcode, so it's a secondary source. Most likely cause of the failures: a transient hiccup in the postcodes.io bulk endpoint — the same postcodes succeed when queried individually.

## Approach

Harden `supabase/functions/backfill-test-centre-coords/index.ts` with two extra passes, then re-invoke it. The current bulk pass stays, but anything still missing is retried.

1. **Bulk pass** (unchanged) — POST `https://api.postcodes.io/postcodes` in 100-row batches against `test_centres.postcode`.
2. **Single-postcode fallback** — for every centre still missing coords, call `GET https://api.postcodes.io/postcodes/{postcode}` one at a time (small request, very reliable). Mild concurrency cap (5 in flight) to stay polite.
3. **Address-extraction fallback** — if the `postcode` column is empty/invalid, run a UK postcode regex (`/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i`) over `address` and try that.
4. **Outward-code fallback** — if a full postcode still fails (some DVSA records have stale full codes but valid outward codes like `AB11`), call `GET /outcodes/{outcode}` which returns the area centroid. Flag the row in the returned report so we know it's approximate.
5. **Report** — return `{ total, updated, single_recovered, address_recovered, outcode_recovered, failed, failures: [{id, name, postcode}] }` so we can see exactly what's left.

## Files

- **Edit** `supabase/functions/backfill-test-centre-coords/index.ts` — add the three fallback passes and richer report.

Then I'll redeploy and invoke once; we should land at or very near 314/314.

## Out of scope

- No schema or RLS changes.
- No client-side changes — the new RPC already returns `distance_miles` correctly the moment a centre has coords.
