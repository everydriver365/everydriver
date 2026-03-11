

## Plan: Use uploaded image as the left-hand hero image

**What changes:**

1. **Copy the uploaded image** into `src/assets/` (e.g., `src/assets/frontpagesquare-4.png`)

2. **Update `src/pages/mini-website/MiniWebsiteHome.tsx`**:
   - Import the new image asset
   - Use it as the default/fallback hero image on the left side of the split layout (lines 121-125), replacing the current `heroImageUrl` fallback gradient — or potentially as the primary image if no instructor hero image is set

This is a straightforward asset swap — the layout stays the same, just the left-side image source changes.

