## Goal
On the desktop instructor dashboard sidebar, clicking **More tools** currently navigates to `/instructor/menu` (a separate page). Change it to behave like the other section headers (Overview, Teaching, Business, Website…) — clicking expands an inline list of items in place.

The expanded list should contain **everything that isn't already shown elsewhere in the sidebar**, organised into clear sub‑groups so it doesn't feel like a dumping ground.

## Scope
- File: `src/components/instructor/dashboardV2/DashboardSidebar.tsx` only.
- Desktop sidebar only. Mobile menu and `/instructor/menu` route untouched (per the project rule against unsolicited mobile changes).
- No backend, no route changes, no data changes.

## Proposed structure
Remove the single `{ label: "More tools", to: "/instructor/menu" }` entry from the **Settings** section, and add new collapsible sections at the bottom of the sidebar that mirror how other groups already expand/collapse:

```text
PRODUCTIVITY
  Notes                /instructor/notes
  Todos                /instructor/todos
  Doodlepad            /instructor/doodlepad
  Plans                /instructor/plans
  Checklists           /instructor/checklists
  Resources            /instructor/resources
  Document templates   /instructor/document-templates
  Document vault       /instructor/document-vault
  Waivers              /instructor/waivers

DAILY OPS
  Daily manifest       /instructor/daily-manifest
  End-of-day report    /instructor/eod-report
  Outstanding tasks    /instructor/outstanding-tasks
  Weekly report        /instructor/weekly-report
  Clock in/out         /instructor/clock-in-out
  Bulk operations      /instructor/bulk-operations
  Workflows            /instructor/workflows
  AI command           /instructor/ai-command

PEOPLE & GROWTH
  Pipeline             /instructor/pipeline
  Enquiries            /instructor/enquiries
  Waiting room         /instructor/waiting-room
  Abandoned checkouts  /instructor/abandoned-checkouts
  Performance          /instructor/performance
  Certifications       /instructor/certifications
  Reports hub          /instructor/reports-hub

VEHICLE EXTRAS  (only when telematics module active)
  Find my car          /instructor/find-my-car
  Fleet dashboard      /instructor/fleet-dashboard
  Overspeed history    /instructor/overspeed-history
  Dashcam gallery      /instructor/dashcam
  Nearby instructors   /instructor/nearby-friends
  Locations            /instructor/locations

WEBSITE EXTRAS
  Mini-site settings   /instructor/mini-website-settings
  Website add-ons      /instructor/website-addons

SUPPORT & UTILITIES
  Install app          /instructor/install
  Send reminder        /instructor/send-reminder
  Contact us           /instructor/contact
  Admin chat           /instructor/admin-chat
  Team channels        /instructor/team-channels
  FAQs                 /instructor/faqs
  Platform updates     /instructor/platform-updates
  Data import          /instructor/data-import
  Wellbeing            /instructor/wellbeing
  Health               /instructor/health
  Accessibility        /instructor/accessibility
```

Each new group uses the same collapsible pattern as existing sections (chevron header, persisted in `dsm.dashboard.sidebar.openGroups`, all closed by default so the sidebar stays compact). Item icons reuse Lucide icons already imported (or add a small set: `StickyNote`, `Inbox`, `Wrench`, etc.).

## Implementation notes
- Add the new sections to the `SECTIONS` array in `DashboardSidebar.tsx`.
- Remove the existing `More tools` row from the Settings group.
- Keep `/instructor/menu` route intact (still works if linked from anywhere else).
- All new groups respect the existing `moduleId` filter, so e.g. Vehicle Extras only render when telematics is on.
- No changes to `DashboardTopBar` title map needed (existing pages already have their own titles).

## Out of scope
- Mobile menu, `/instructor/menu` page, route changes, renaming pages, or moving sections between the existing groups.
- Inline panels / modal renderers — items still navigate to their existing pages, the change is purely making **More tools** an expandable inline group instead of a link.
