## Goal
Add an **Integrations** hub at `/instructor/integrations` where instructors can link Google Calendar, Square, and Xero from a single tabbed page — replacing the current dead sidebar link.

## New page: `src/pages/instructor/InstructorIntegrationsHub.tsx`
Tabbed page with 3 tabs, each reusing existing components:

| Tab | Component (already exists) |
|---|---|
| Google Calendar | `<GoogleServiceAccountSetup />` — sync lessons to Google Calendar |
| Square | `<SquareConnectSettings />` — accept card payments + payouts |
| Xero | `<XeroExport />` — export invoices/expenses to Xero |

- `?tab=…` deep linking.
- Same instructor-portal styling (`rounded-2xl`, `bg-card`, `--d2-bg`).

## Routing
Add to `src/routes/instructorPortalRoutes.tsx`:
- `/instructor/integrations` → `InstructorIntegrationsHub`

The sidebar already links to `/instructor/integrations` (currently 404), so that will start working automatically.

## Out of scope
- No mobile changes.
- No new API/backend work — Google service-account, Square OAuth, and Xero export already exist.
- QuickBooks / FreeAgent / Sage already supported via `XeroExport`'s underlying platform configs but kept off this hub for now (Xero only, per request).
