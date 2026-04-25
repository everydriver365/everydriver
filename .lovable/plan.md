I found the missing spot: the instructor mobile home page is not using the earlier database-driven tile grid for the visible horizontal/swipe quick-actions section. It uses `SwipeableQuickAccess`, which has its own hardcoded tile list.

Plan:
1. Add an `Accessibility` quick-action tile directly to the `SwipeableQuickAccess` tile list.
   - Title: `Accessibility`
   - Subtitle: `Text size`
   - Icon: accessibility/person icon
   - Route: `/instructor/accessibility`
2. Place it in the first quick-actions page so it is immediately visible without needing to search or swipe through many pages.
3. Keep the existing accessibility settings page and `/instructor/accessibility` route already created.
4. Run a compile check to confirm the mobile home page still builds cleanly.

Technical detail:
- File to update: `src/components/instructor/SwipeableQuickAccess.tsx`
- No database change needed for this visible carousel.