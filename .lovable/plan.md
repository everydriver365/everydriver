

## Plan: Add Feature Detail Modal to Mini-Site "What's Included" Tiles

### Problem
On the Drive365 homepage, clicking a "What's Included" tile opens a `FeatureDetailModal` showing detailed content. On the Ken D mini-site, the tiles are plain `div` elements with no click handler and no modal — they do nothing when tapped.

### Changes

**`src/pages/mini-website/MiniWebsiteHome.tsx`**
1. Import `FeatureDetailModal` from `@/components/FeatureDetailModal` and `FeatureData` from `@/hooks/useHomepageFeatures`
2. Add state: `selectedFeature` and `featureModalOpen`
3. Add `openFeatureModal` helper function (same pattern as Index.tsx)
4. Change feature tiles from `motion.div` to `motion.button` with:
   - `onClick={() => openFeatureModal(feature)}`
   - `whileTap={{ scale: 0.95 }}`
   - `className` adding `text-left cursor-pointer`
5. Render `<FeatureDetailModal>` at the bottom of the component, before the closing fragment

No database changes needed.

