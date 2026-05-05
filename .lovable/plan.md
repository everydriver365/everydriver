## Goal
Surface the major instructor features that are currently hidden behind `/instructor/menu`. Restructure `DashboardSidebar.tsx` so the nav reflects what the portal can actually do.

## New sidebar structure

**Overview**
- Dashboard → `/instructor`
- Schedule → `/instructor/schedule`
- Diary → `/instructor/diary`
- Inbox → `/instructor/messages` (badge)

**Teaching**
- Pupils → `/instructor/pupils`
- Course Planner → `/instructor/course-planner`
- Waiting List → `/instructor/waiting-list`
- Fill Gaps → `/instructor/gaps`
- Test Bookings → `/instructor/test-bookings`
- Test Results → `/instructor/test-results`
- Test Swap → `/instructor/test-swap`
- Slot Finder → `/instructor/test-slot-finder`
- Standards Check → `/instructor/standards-check`
- CPD → `/instructor/cpd`

**Vehicle & Tracking** *(new section, gated by `telematics` module where applicable)*
- Live Tracking → `/instructor/tracking`
- Fleet Map → `/instructor/fleet-map`
- Vehicle Health → `/instructor/vehicle-health`
- SatNav → `/instructor/satnav`
- Dashcam → `/instructor/dashcam`
- Mileage → `/instructor/mileage`
- Fuel → `/instructor/fuel`
- Saved Routes → `/instructor/routes`

**AI Voice** *(new)*
- AI Voice Hub → `/instructor/menu?open=famulor`

**Business**
- Take Payment → `/instructor/take-payment`
- Payments → `/instructor/pay`
- Invoices → `/instructor/invoices`
- Pending → `/instructor/pending-scheduling`
- Expenses → `/instructor/expenses`
- Tax → `/instructor/tax`
- Reports → `/instructor/income`
- Reviews → `/instructor/reviews`
- Referrals → `/instructor/referrals`
- Automations → `/instructor/automations`

**Website**
- My Site → `/website/my-site`
- Branding → `/instructor/menu?open=appearance`
- Domain → `/instructor/domains`
- SEO → `/instructor/seo`

**Settings**
- Profile → `/instructor/settings`
- Plan & Billing → `/instructor/billing`
- Modules → `/instructor/modules`
- Integrations → `/instructor/integrations`
- More tools → `/instructor/menu` *(catch-all for Notes, Todos, Doodlepad, Document Vault, Workflows, etc.)*

## Implementation
- Edit only `src/components/instructor/dashboardV2/DashboardSidebar.tsx`: replace the `SECTIONS` array with the structure above, add the new lucide icons (`Mic`, `MapPin`, `Map`, `Gauge`, `Navigation`, `Video`, `Route`, `Fuel`, `NotebookPen`, `BookOpenCheck`, `GraduationCap`, `Star`, `Share2`, `Zap`, `Banknote`, `Receipt`, `Coins`, `MoreHorizontal`).
- Keep existing `moduleId` filtering so users without a module don't see those rows.
- No route or backend changes required — every destination already exists.

## Out of scope
- No mobile sidebar changes (per mobile update policy).
- No changes to `/instructor/menu` itself.
