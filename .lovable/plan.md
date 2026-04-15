

## DSM Wrapper Layout for All Instructor Pages

### What it does
Creates a reusable `DSMLayout` wrapper component that applies the iOS-style design from the DSM homepage to all existing instructor pages. Each feature tile on the DSM page will navigate to `/instructor-app/dsm/{feature}` routes, which render the existing page components inside this new consistent wrapper -- no need to rebuild 80+ pages.

### Design
The `DSMLayout` wrapper replaces `InstructorPortalLayout` visually with:
- iOS-style `#F2F2F7` background
- A slim header with back arrow and page title (matching DSM's font/spacing)
- No sidebar or bottom nav (clean single-page focus, back button returns to DSM)
- Content area renders the existing component directly

### Changes

**New file: `src/components/layout/DSMLayout.tsx`**
- Accepts `title` and `children` props
- Renders iOS-style sticky header with back navigation to `/instructor-app/dsm`
- `#F2F2F7` background, SF-style typography, `rounded-2xl` content cards
- Wraps children in consistent padding

**New file: `src/routes/dsmRoutes.tsx`**
- ~80 routes under `/instructor-app/dsm/*` (e.g. `/instructor-app/dsm/pupils`, `/instructor-app/dsm/schedule`)
- Each route renders the existing page component (e.g. `InstructorPupils`) wrapped in `DSMLayout`
- Lazy-loaded like all other routes

**Updated: `src/pages/instructor-app/DSM.tsx`**
- Update all `featureTiles` routes from `/instructor/xxx` to `/instructor-app/dsm/xxx`
- Update quick tiles, schedule link, CTA routes similarly
- Add all ~80 real functions from the instructor portal (replacing the current 40 placeholder tiles)

**Updated: `src/routes/instructorAppRoutes.tsx`**
- Import and spread `{dsmRoutes}` into the route tree

### How it works
```text
DSM Homepage ──click tile──▶ /instructor-app/dsm/pupils
                                │
                                ▼
                          DSMLayout (iOS header + back btn)
                                │
                                ▼
                          <InstructorPupils /> (existing component)
```

Each existing page component renders its own content inside the DSMLayout wrapper. The wrapper overrides the outer chrome (header, nav) while preserving all functionality. Pages that use `InstructorPortalLayout` internally will have it nested -- we'll handle that by having the DSMLayout detect and suppress the inner layout's nav elements via a context flag.

### Summary
4 files touched. One new layout component, one new route file, two updates. All 80+ functions available under the DSM with consistent iOS styling, zero page rebuilds.

