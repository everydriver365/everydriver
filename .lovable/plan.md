I’ll replace the current mixed settings experience with one consistent desktop settings shell.

Plan:

1. Create a single settings navigation model
   - Use one sidebar for all instructor settings sections instead of mixing the newer sidebar, old category hub, Account Hub tabs, and external settings jumps.
   - Group items under sensible headings like Account, Teaching, Bookings, Schedule, Communication, Website, Vehicle, and Advanced.
   - Each sidebar item selects one detail panel on the right.

2. Keep users in the same settings layout
   - Clicking Notifications, Profile, Availability, Branding, Terms, Calendar, Famulor, Plan/Billing shortcuts, etc. will stay inside `/instructor/settings` layout.
   - Where existing links currently navigate to `/instructor/settings/comms#notification-prefs`, `/instructor/settings/business#terms`, or “All other settings”, update them to select the matching right-hand panel instead.
   - Remove the “All other settings” split that drops users into a different layout.

3. Render one detail section at a time
   - The right pane will show only the selected section, not a stacked category page.
   - The URL can remain bookmarkable using a lightweight pattern like `/instructor/settings/:sectionId`, but the visual shell will not change.
   - Legacy paths will redirect into the same shell and preselect the relevant section.

4. Preserve existing functionality
   - Reuse existing working components such as notification preferences, push settings, profile editors, booking/payment managers, working hours, calendar sync, call answering, Famulor, website settings, dashboard layout, exports, etc.
   - Avoid database or notification logic changes.
   - Keep mobile layouts unchanged unless you explicitly ask for mobile redesign.

Technical notes:

- Refactor `InstructorSettingsHub` to always use the unified desktop shell for settings routes.
- Replace the split between `SettingsLayoutV2`, `SettingsSidebar`, and the legacy `SettingsLayout` with one shared sidebar/detail component for desktop.
- Keep old route redirects in `instructorPortalRoutes.tsx`, but point them to the correct unified section IDs.
- Update settings shortcut links so they no longer navigate to separate-looking pages.