# Stop the Chapman's page from inheriting `?courseType=10` (and other course filters) from the URL

## What's happening

The Chapman's booking page (`/booking/chapmans`) embeds the Drive365 `<Courses embedded />` explorer. That component reads its initial filter state directly from `useSearchParams()` — `postcode`, `radius`, `transmission`, `klarna`, `clearpay`, `courseType`, `priceRange` — and writes back to the URL when pills/inputs change.

So a URL like `/booking/chapmans?postcode=SO302TD&courseType=10` makes the embed boot with the "10-hour" pill pre-selected, even though you never asked for that. The param was almost certainly carried over from an earlier visit to `/courses` or a shared link.

## Fix

When `embedded` is true, the explorer should be fully self-contained — no reading from and no writing to the parent route's query string.

Change in `src/pages/Courses.tsx`:

1. When `embedded`, ignore `searchParams` for initial state — every filter starts at its natural default (`courseType="all"`, `transmission="all"`, `postcode=""`, etc.).
2. When `embedded`, make `setSearchParams` a no-op so clicking pills, changing radius, etc. don't mutate `/booking/chapmans`'s URL.

No changes needed in `PublicBookingPortal.tsx`. Standalone `/courses` behaviour is unchanged.

## Files

- **Edited:** `src/pages/Courses.tsx` — gate all `searchParams` reads/writes behind `!embedded`.
