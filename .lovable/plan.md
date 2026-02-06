

## Add Left Accent Border to Quick Action Tiles

Add a `#1877F2` left accent border to the quick action tiles on the instructor mobile home page for visual distinction.

### Changes

**File: `src/components/instructor/QuickActionTiles.tsx`**
- Add `border-l-4 border-l-[#1877F2]` to the main (first) tile container
- Add `border-l-4 border-l-[#1877F2]` to the smaller grid tiles

### Testing
- Verify the tiles on the instructor home page at mobile viewport size to confirm the accent border looks good against the `#E8F1FE` background

