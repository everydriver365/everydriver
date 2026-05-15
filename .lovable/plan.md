The preview is not updating because the EveryDriver preview override is sticky in session storage. Once `/courses` or `?everydriver=1` is visited in preview, `isEveryDriverHost()` returns true for the whole preview session, so `/drive365` can mount the EveryDriver route set instead of the Drive365 route set. That also explains why the course search page shows the older card/grid UI: EveryDriver is routed to `src/pages/everydriver/CourseResults.tsx`, while the Drive365 list redesign lives in `src/pages/Courses.tsx`.

Plan:

1. Stop EveryDriver preview mode from hijacking Drive365 pages
   - Update `isEveryDriverHost()` / preview override logic so `/drive365` and `/drive365/*` always stay Drive365 in preview.
   - Keep `?everydriver=1` available only for explicitly testing EveryDriver pages.
   - Prevent visiting plain `/courses` in preview from permanently switching the whole session into EveryDriver mode.

2. Make Drive365 course links consistently point to Drive365 search
   - In Drive365 homepage/header/banner links, route course searches to `/drive365/search` where appropriate so preview and live Drive365 do not accidentally enter the EveryDriver clone path.
   - Keep `/test-swap` internal and unchanged.

3. Verify the actual preview behavior
   - Re-check `/drive365` at the current desktop viewport.
   - Confirm the Drive365 header/nav is visible, the Test Swap banner/link opens `/test-swap` internally, and course search opens the redesigned Drive365 list/table UI rather than the EveryDriver card/grid UI.

No backend or data changes are needed.