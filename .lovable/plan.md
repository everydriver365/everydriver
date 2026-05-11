The tile has changed in the code, and the preview confirms it is rendering, but it does not match the requested redesign because the currently visible branch is `NextLessonPreviewCard` for lessons more than 4 hours away. That branch was only partially restyled and still shows the old ordering: map first, then date chip, name row, lesson/location rows.

Plan:
1. Update only the mobile collapsed `NextLessonPreviewCard` presentation so the visible tile uses the requested structure:
   - white rounded tile container
   - `#F0F5FF` header band at the top
   - avatar/name/date on the left and large start time/countdown on the right
   - 72px map strip below the header
   - details rows, AI divert pill, action buttons, then details toggle
2. Keep the expanded state unchanged so existing stats/payment/notes detail behaviour remains intact.
3. Keep all current handlers and data wiring exactly as-is: call, text, navigate, profile open, map/ETA, AI divert rendering, and expansion state.
4. Verify on `/instructor` at mobile viewport that the visible tile no longer starts with the large map and now shows the header band first.