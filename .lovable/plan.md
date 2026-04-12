
What’s happening
- No, you do not need to manually rebuild the app.
- The real problem is routing/context: the redesign chooser was put on a standalone demo route, and you were looking inside the instructor mobile app. Also, the published/installed app will not show preview-only changes until they are published.
- I also found two separate demo pages for this tile (`/instructor/next-up-demo` and `/demo/next-up-redesigns`), which is why the links have been inconsistent.

Plan
1. Use one in-app demo page only
   - Consolidate the Next Up redesigns into a single instructor route under `/instructor/*` so it opens inside the instructor mobile app, not on a separate demo path.
   - I’ll reuse the existing instructor demo page rather than relying on the standalone `/demo/*` page.

2. Add a tappable entry point inside the app
   - Add a temporary card/button from the instructor home or Home Designs area so you can open the chooser directly without typing a URL.

3. Show clear mobile-first options
   - Present 3 strong variants on one page with the same sample data, A/B/C labels, and short descriptions.
   - Each option will keep the current behavior: expand/collapse, navigate, call, SMS, “I’m Here”, late alert, unread badge, timing, location, and expanded actions.

4. Apply the winner to the live tile
   - Once you pick a design, update `NextUpTile` so the real tile on the instructor home uses that layout.

5. Verify the right surface
   - Check it end-to-end from inside the instructor mobile app preview.
   - If you want it on the installed/public app too, publish after the change so the app can pick up the new version.

Technical details
- Current relevant files:
  - `src/components/instructor/NextUpTile.tsx`
  - `src/pages/instructor/NextUpTileDemo.tsx`
  - `src/pages/demo/DemoNextUpRedesigns.tsx`
  - `src/routes/instructorPortalRoutes.tsx`
  - `src/routes/demoRoutes.tsx`
  - `src/pages/InstructorHomeDesigns.tsx`
- Best implementation direction:
  - Keep the chooser on an `/instructor/*` route and expose it from inside the app.
  - Stop relying on the separate `/demo/next-up-redesigns` page for this flow.
