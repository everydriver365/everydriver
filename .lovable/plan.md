I confirmed `Refine results`, `Pass Promise`, and `Your Match` still exist in `src/pages/Courses.tsx`, but they are being trapped below the visible area because the left sidebar is `sticky` and the enlarged calendar now takes up most of the 626px viewport height.

Plan:
1. Modify only `src/pages/Courses.tsx`.
2. Keep the existing calendar/date logic and all three existing below-calendar sections unchanged.
3. Update the sticky left sidebar wrapper so it has a viewport-based max height and its own vertical scroll, allowing `Refine results`, `Pass Promise`, and `Your Match` to be reached below the calendar.
4. Preserve desktop behavior only; no mobile layout changes.