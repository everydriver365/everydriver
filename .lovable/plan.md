## Fix squashed stats row on mobile pupils list

The summary bar on `src/pages/InstructorPupils.tsx` (lines ~695-765) packs four stats (Active, Overdue, Today, Passed) + the Add pupil button into one row. On a 390px viewport the "Passed" stat is clipped behind the button.

### Changes (mobile only, this file only)

1. **Reduce horizontal padding** on the bar from `0 18px` to `0 12px`.
2. **Tighten the gap** between stats from `14` to `10` and the inner stat/divider gap from `14` to `8`.
3. **Shrink the dividers** from `width:1, height:28` to `width:1, height:22` so they consume less inline space.
4. **Make stats slightly more compact**: drop the value font from `16` to `15` and label letter-spacing from `0.5` to `0.4` so all four labels (ACTIVE, OVERDUE, TODAY, PASSED) fit cleanly before the button.
5. **Allow graceful overflow as a safety net**: add `overflowX: "auto"` + `scrollbarWidth: "none"` to the stats container so a future 5th stat or a narrower phone still scrolls horizontally instead of clipping.
6. **Slim the Add pupil button** padding from `6px 12px` to `6px 10px` and ensure it stays `flexShrink:0` (already set).

No desktop layout, no business logic, no other files touched. Per project memory I'm only adjusting this mobile screen because the user explicitly asked.