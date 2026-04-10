
Why they are not sticky:
- The shared mobile layout wraps page content in a `<main>` with `overflow-x-hidden` in `src/components/layout/InstructorPortalLayout.tsx`.
- Your shared page title component `InstructorPageHeader` is inside that `<main>`.
- `position: sticky` often stops working when any ancestor has overflow applied, so the page title bar cannot stick reliably even though it has `sticky top-14`.
- On top of that, some instructor mobile pages do not use the shared layout/header pattern at all. Pages like `InstructorDailyManifest`, `InstructorEODReport`, `InstructorCertifications`, `InstructorAbandonedCheckouts`, `InstructorCPD`, and similar have their own local headers with `top-0`, so behavior is inconsistent across the app.

What I would change:
1. Fix the shared mobile layout so sticky children can work
- In `InstructorPortalLayout.tsx`, remove the overflow constraint from the mobile `<main>` wrapper or move horizontal clipping to a non-sticky-breaking wrapper.
- Keep the background image behavior, but ensure the actual scroll container does not block sticky positioning.

2. Make the shared page-title header align with the blue mobile header
- Update `InstructorPageHeader.tsx` so it uses the same blue styling as the instructor homepage/non-home mobile header.
- Keep it sticky below the main app header with the correct offset for the mobile top bar/safe area.
- Give it a solid/blurred background and z-index that layers correctly.

3. Standardize pages that currently bypass the shared pattern
- Convert the custom mobile pages with their own manual headers to use `InstructorPortalLayout` + `InstructorPageHeader`, or at minimum make their header offsets consistent with the app shell.
- This applies to pages like:
  - `InstructorDailyManifest.tsx`
  - `InstructorEODReport.tsx`
  - `InstructorCertifications.tsx`
  - `InstructorAbandonedCheckouts.tsx`
  - `InstructorCPD.tsx`
  - similar pages still using `sticky top-0` local bars

4. Check for page-specific containers that still break sticky
- Review components/pages that set fixed heights or inner scroll areas near the top, such as messaging and other tool pages.
- Adjust any page-level wrappers if needed so only the intended viewport scrolls.

5. Verify the final behavior on real mobile page flows
- Confirm the title bar stays visible while scrolling on non-home instructor mobile pages.
- Confirm the title bar sits directly under the blue app header and does not overlap search overlays, sheets, or the bottom nav.
- Confirm pages with custom headers now behave the same as pages using `InstructorPageHeader`.

Technical notes:
- Current shared sticky title is here:
  - `src/components/instructor/InstructorPageHeader.tsx`
- Current mobile layout that likely breaks sticky is here:
  - `src/components/layout/InstructorPortalLayout.tsx`
- The issue is structural, not that `sticky` is missing.
- Some routes are already using `InstructorPageHeader`, but others still render their own headers directly, so a full fix needs both layout and page cleanup.
