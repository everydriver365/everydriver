

# Remove Demo Pages

## Summary
Clean up the codebase by removing 22 demo and showcase pages that were used for design exploration. This will reduce bundle size and simplify the routing.

## Pages to Remove

**Standalone demo pages (14 files):**
- `src/pages/HeroLayoutDemo.tsx`
- `src/pages/CollageDemo.tsx`
- `src/pages/HeroRedesignDemo.tsx`
- `src/pages/MobileHomeDemo.tsx`
- `src/pages/MobilePortalDemo.tsx`
- `src/pages/InstructorMobileDemo.tsx`
- `src/pages/InstructorTileDemo.tsx`
- `src/pages/DesignDemo.tsx`
- `src/pages/InstructorHeroDemo.tsx`
- `src/pages/InstructorHomeDesignDemo.tsx`
- `src/pages/InstructorBlueStyleDemo.tsx`
- `src/pages/QuickActionGradientDemo.tsx`
- `src/pages/HomepageRedesignDemo.tsx`
- `src/pages/MobileHomeRedesignDemo.tsx`
- `src/pages/MobileHomeRedesignDemo2.tsx`
- `src/pages/MobileHomeIOSDemo.tsx`
- `src/pages/DiaryImageDemo.tsx`
- `src/pages/TileDesignDemo.tsx`

**Instructor app demo pages (2 files):**
- `src/pages/instructor-app/DesignDemo.tsx`
- `src/pages/instructor-app/PortalLayoutDemo.tsx`

**Showcase pages (2 files):**
- `src/pages/NextUpTileShowcase.tsx`
- `src/pages/TodoTileShowcase.tsx`

**Instructor portal demo (1 file):**
- `src/pages/PupilCardDemo.tsx`

## Routes to Remove

From `src/App.tsx`:
- `/design-demo`
- `/hero-demo`
- `/collage-demo`
- `/hero-redesign`
- `/mobile-home-demo`
- `/mobile-portal-demo`
- `/instructor-mobile-demo`
- `/instructor-tile-demo`
- `/instructor-hero-demo`
- `/instructor-home-demo`
- `/instructor-blue-demo`
- `/quick-action-gradient-demo`
- `/diary-image-demo`
- `/tile-design-demo`
- `/instructor-app/design-demo`
- `/instructor-app/portal-layout-demo`
- `/homepage-redesign-demo`
- `/mobile-home-redesign`
- `/mobile-home-redesign-2`
- `/mobile-home-ios-demo`
- `/instructor/next-up-showcase`
- `/instructor/todo-tile-showcase`
- `/instructor/pupil-card-demo`

## Changes to `src/App.tsx`
- Remove all 23 import statements for the demo/showcase pages
- Remove all 23 Route entries listed above

## What Will NOT Be Removed
- The **Demo Mini Site** section in AdminPortal (this is a functional admin tool for managing the Sarah Mitchell demo instructor website, not a design exploration page)
- The `DemoMiniSiteCMS` component in `src/components/admin/`
- Any demo assets that may be shared with production pages (will verify during implementation)

## Technical Details
- Total files deleted: ~23 page components
- Total routes removed: ~23
- `App.tsx` will be updated to remove all related imports and route definitions
- Any orphaned asset imports (e.g. `src/assets/demo/`) will be cleaned up if not used elsewhere

