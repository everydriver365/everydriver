

# Discover Features Tile & Feature Explorer

## What We're Building
A "Discover Features" tile placed below the Quick Access section on the instructor home screen. Tapping it opens a full-screen sheet listing every app capability with an icon, title, one-line summary, and a "Learn more" link. The "Learn more" opens a detail view with a fuller explanation and a "Go there" button pointing to the relevant route.

## Approach

### 1. New Component: `DiscoverFeaturesTile.tsx`
A standalone tile styled to match the existing ticket/pass aesthetic (like the Waiting Room tile). Uses a `Compass` or `Sparkles` icon. Tapping opens the feature explorer sheet.

### 2. New Component: `DiscoverFeaturesSheet.tsx`
A bottom sheet (using the existing `Sheet` component) containing:
- A scrollable list of all app features, derived from the existing `ALL_TILES` data in `SwipeableQuickAccess.tsx` plus richer descriptions
- Each row: icon, title, one-line description, "Learn more →" link
- Tapping "Learn more" expands inline or navigates to a detail sub-view within the same sheet showing:
  - Fuller explanation of what the feature does
  - "Go to [Feature]" button that closes the sheet and navigates to the route

### 3. Feature Data
Create a `discoverFeaturesData.ts` file with an array of feature objects:
```
{ title, icon, route, summary, detailedDescription, category }
```
Categories like "Scheduling", "Money", "Tracking", "Tools", "Growth" to group features in the sheet with section headers.

### 4. Integration
Add `<DiscoverFeaturesTile />` in `InstructorMobileHome.tsx` after the `SwipeableQuickAccess` section (and equivalently in `BestMateHomeView` and `CompactHomeView` where SwipeableQuickAccess is used).

### 5. UX Details
- Sheet opens from bottom, nearly full height
- Search/filter bar at top of sheet for quick finding
- Features grouped by category with collapsible sections
- "Learn more" toggles an expanded description inline with a slide animation
- The "Go there →" button navigates and auto-closes the sheet

