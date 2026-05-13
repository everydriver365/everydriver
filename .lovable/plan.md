# Remove `/earlier-test-guarantee` Page and Related Components

## Scope
Remove the standalone `/earlier-test-guarantee` page and all directly related production components now that the free re-test CTA has been removed from the homepage.

## Changes

### 1. Delete page and component files
- `src/pages/EarlierTestGuarantee.tsx`
- `src/components/benefits/EarlierTestRequestTile.tsx`
- `src/pages/DemoETGBanner.tsx`
- `src/pages/DemoETGDesigns.tsx`

### 2. Remove route definitions
- `src/routes/publicRoutes.tsx` — remove `EarlierTestGuarantee` lazy import and `/earlier-test-guarantee` Route
- `src/routes/demoRoutes.tsx` — remove `/demo/etg-banner` and `/demo-etg-designs` routes

### 3. Remove usages
- `src/pages/Benefits.tsx` — remove `EarlierTestRequestTile` import and `<EarlierTestRequestTile />` JSX usage

### 4. Clean up sitemap
- `public/sitemap.xml` — remove `/earlier-test-guarantee` URL entry

## Out of scope
- Demo/design exploration pages (`DemoHeroSections`, `DemoCTASections`, `DemoFeatureSections`, `DemoKenD*`, `DemoMiniWebsite*`) — these are static `/demo/*` design previews with mock copy, not production features tied to the guarantee page.
- The `free-retest-badge.png` asset may still be referenced by demo pages; it will become orphaned from production code and can be cleaned up separately if desired.
