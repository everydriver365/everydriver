
# Remove Early Test Guarantee Icon from Course Tiles

## Overview
Remove the "Earlier Test Guarantee" badge image from the Intensive and Semi-Intensive course tiles on the Drive365 mobile homepage. The guarantee banner CTA further down the page will remain unchanged.

## Changes

**File: `src/components/MobileHomepage.tsx`**

1. **Intensive Courses tile (line 192)** -- Remove the `<img src={earlyTestBadge} .../>` element from inside the tile's text area.

2. **Semi-Intensive tile (line 213)** -- Remove the `<img src={earlyTestBadge} .../>` element from inside the tile's text area.

No other files or database changes are needed. The early test guarantee banner CTA section and the `earlyTestBadge` import will remain since the banner still uses it.
