
# Fix: Show All Test Centres from Scrape

## Problem
The `fetchTestCentres()` function sends an empty body `{}` to the edge function. The edge function treats empty bodies as "auto mode", which only scrapes centres that match existing `want_test` requests (currently just "Lee on the Solent"). The "discover all centres" code path (lines 338-381 of the edge function) is never reached.

## Solution
Two small changes to fix the routing logic:

### 1. Update `src/lib/api/firecrawl.ts`
Change `fetchTestCentres()` to send `{ mode: 'discover' }` instead of `{}`, so the edge function knows to run the "discover all centres" scrape.

### 2. Update `supabase/functions/scrape-test-slots/index.ts`
Adjust the routing logic so that:
- `mode: 'auto'` or completely empty body (from cron) triggers auto mode
- `mode: 'discover'` or any body without a `centre` and without `mode: 'auto'` triggers the discover-all-centres scrape
- A body with `centre` specified triggers single-centre scrape (unchanged)

## Technical Details

**`src/lib/api/firecrawl.ts`** - Change line 27:
```typescript
// Before:
body: {},
// After:
body: { mode: 'discover' },
```

**`supabase/functions/scrape-test-slots/index.ts`** - Adjust the condition at lines 327-334:
```typescript
// Only run auto mode if explicitly mode:'auto' OR if body parsing failed (no body = cron trigger)
if (body.mode === 'auto') {
  return await handleAutoMode(apiKey);
}
```

This way, the default call from the frontend (with `mode: 'discover'`) will fall through to the centre discovery scrape, which opens the dropdown on the test booking site and extracts all available centre names. The cron/scheduled calls can explicitly use `mode: 'auto'`.

No other files need to change. The existing dropdown UI and slot-loading-per-centre logic in `AvailableTestSlots.tsx` remains exactly as it is.
