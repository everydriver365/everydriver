
# Redesign Mobile Hero Section

Update the learner mobile homepage hero to match the reference design with the following changes:

## Visual Changes

1. **"Earlier Test Guaranteed" badge** -- Position the existing `earlyTestBadge` image overlapping the bottom-left corner of the hero image (partially over the image, partially over the navy card below).

2. **Navy search card redesign** -- Replace the current "Search, Compare & Book Direct 24/7" card with:
   - "EARLIER TEST **GUARANTEED**" as the main headline, with "GUARANTEED" in gold/amber color
   - "Search, Compare and Book Direct" as the subtitle in white
   - Both lines centered

3. **Search bar update** -- Change the search form layout to:
   - Postcode input (with MapPin icon inside)
   - A separate location/crosshair button (square, light gray)
   - A separate search button (square, light gray)
   - All three in a horizontal row with rounded corners and a white background container

## Technical Details

**File:** `src/components/MobileHomepage.tsx`

- Lines ~139-174 (hero + search card section) will be restructured
- The `earlyTestBadge` import (line 23) is already available
- The badge will be positioned with `absolute` at the bottom-left of the hero image container, using negative bottom offset to overlap the card
- The search card background stays `bg-primary` (navy) with updated text hierarchy
- Search form will use a white rounded container with the input and two icon buttons side by side
- The "GUARANTEED" text will use `text-amber-400 font-black` styling

No new assets or dependencies needed -- all existing imports are sufficient.
