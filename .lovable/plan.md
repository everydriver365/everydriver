## Goal
Surface live connection status for **Google Calendar**, **Square**, and **Xero** in the Integrations Hub — both as a badge on each tab trigger and as a status banner inside each tab's content.

## Status sources

| Integration | Connected when | How to check |
|---|---|---|
| Google Calendar | `instructor_google_service_calendar.is_active = true` for instructor | Reuse `useGoogleServiceCalendar.checkConnection()` (already returns `{ connected, lastSync }`) |
| Square | `instructor.square_merchant_id` is set | Already on `instructor` from `useInstructorAuth` |
| Xero | CSV-based, no credentials stored | Always show **Available** (with a tooltip clarifying it's a manual export) |

## New shared component
`src/components/instructor/integrations/IntegrationStatusBadge.tsx`
- Variants: `connected` (emerald + check), `disconnected` (muted + minus), `available` (sky + dashed circle), `loading` (spinner).
- Small pill with icon + label, sized `sm` for tab triggers and `md` for in-tab banners.

## New status hook
`src/hooks/useIntegrationStatuses.ts`
- Returns `{ googleCalendar, square, xero }` each `IntegrationStatusKind`, plus `lastSync` strings where relevant.
- Google: invokes `google-calendar-service { action: "checkConnection" }` once on mount and on `refresh()`.
- Square: derived from `instructor.square_merchant_id` (no extra fetch).
- Xero: hard-coded `"available"`.

## Hub changes (`InstructorIntegrationsHub.tsx`)
- Call `useIntegrationStatuses(instructorId, instructor)`.
- For each tab in `TABS`, render the `IntegrationStatusBadge` next to the label inside `TabsTrigger` (visible on all viewports — desktop next to text, mobile next to icon).
- Inside each `TabsContent`, render a top status row:
  - `<IntegrationStatusBadge size="md" />` + small text:
    - Google: "Last synced X" or "Connect to start syncing"
    - Square: merchant id short tail or "Connect to take card payments"
    - Xero: "Manual CSV export — no account linking required"

## Out of scope
- No mobile layout changes elsewhere.
- No new database fields or edge functions.
- Existing components inside each tab keep their own detailed status sections; the new badge is a top-level summary.
