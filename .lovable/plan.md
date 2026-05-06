Add a "Connections" hub for instructors (mobile + desktop) covering Square, Google Calendar, and GPS Trackers. Reuse the existing `/instructor/integrations` page.

### Changes
1. **`src/hooks/useIntegrationStatuses.ts`** — add `trackers` status + `trackerDevices[]` by querying `gps_devices` for the instructor.
2. **`src/pages/instructor/InstructorIntegrationsHub.tsx`**
   - Rename heading "Integrations" → "Connections".
   - Add a 4th tab **Trackers** (Satellite icon).
   - Trackers panel: list active GPS devices (name, provider, last seen). If none, show CTA. Always show a "Manage trackers" button → `/instructor/gps-setup`.
   - Make tab grid responsive (4 cols on `sm:`, scrollable on mobile).
3. **`src/pages/InstructorMenu.tsx`** — add a top-level "Connections" tile (Plug icon) under preferences pointing to `/instructor/integrations`.

No DB or route changes. Works on mobile + desktop via existing `InstructorPortalLayout`.