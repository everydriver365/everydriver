## Goal

Replace the scattered instructor portal navigation (40+ tiles, duplicate Profile/AccountHub/Settings pages, multiple availability pages) with a clean **5-hub** structure and a fully rebuilt **two-pane Settings** experience that works identically on desktop and mobile.

## The 5 top-level hubs

Bottom nav (mobile) and left sidebar (desktop) — exactly five entries, nothing more:

```text
1. Today        /instructor          → Home, briefing, next-up, alerts
2. Schedule     /instructor/schedule → Diary, availability, gaps, waiting list
3. Pupils       /instructor/pupils   → Pupils, enquiries, messages, pending
4. Money        /instructor/money    → Income, expenses, payments, tax, plan
5. Settings     /instructor/settings → Single hub for EVERYTHING configurable
```

All current standalone pages still exist as routes, but they are reached **only** through one of these five hubs. No more `Menu`, no more `Profile` vs `AccountHub` vs `Settings/profile` duplication.

## New Settings hub (full rebuild)

iOS Settings model — two-pane on desktop, drill-down on mobile, same components.

```text
Desktop (≥md)                          Mobile (<md)
┌──────────────┬─────────────────────┐  ┌─────────────────┐
│ Search…      │  Section title      │  │ Search…         │
│              │  ─────────────      │  │ ▸ Account       │
│ ▸ Account  ●│  [form / toggles]   │  │ ▸ Business      │
│ ▸ Business   │                     │  │ ▸ Bookings…     │
│ ▸ Bookings   │                     │  └─────────────────┘
│ ▸ Website    │                     │  taps push a panel
│ ▸ Schedule   │                     │  with same content
│ ▸ Vehicle    │                     │  as the right pane
│ ▸ Comms      │                     │
│ ▸ Advanced   │                     │
└──────────────┴─────────────────────┘
```

### 8 categories (down from 7 messy ones)

1. **Account** — profile, vehicle, photos, compliance docs, emergency contacts
2. **Business** — terms, cancellation, no-show, GDPR, branding, mini-website pages & theme
3. **Bookings & Payments** — courses, booking mode, deposits, packages, discounts, pricing rules, intake questions, BNPL, commission, Square, referrals
4. **Schedule** — working hours, availability windows, calendar sync, reminders, pupil self-service
5. **Vehicle & Tracking** — GPS, saved routes, dashcam, fuel, mileage
6. **Communication** — notifications, call answering, Famulor (AI calls), WhatsApp
7. **Integrations** — Square, Google Calendar, GPS Gate, Kinesis, accounting
8. **Advanced** — demo mode, appearance, dashboard layout, data export, reset stats, plan & billing

Search bar at top filters across all sections (already-built fuzzy matcher reused).

## Key UX rules

- Every section panel uses one shared `<SettingsSection>` component: title, description, save bar that auto-shows when dirty, success/error toast via `friendlyDbError()`.
- All forms use the same field primitives (`SettingsField`, `SettingsToggleRow`, `SettingsSelect`) so spacing, labels, and error states are identical across the portal.
- Mobile: each category is a route (`/instructor/settings/:categoryId`) so back-swipe + browser history work. Desktop: same routes, but rendered into the right pane with the left rail persistent.
- No more inline sheets or modals for settings — every section is a real page so deep-links work and the back button is predictable.

## Page consolidation (what gets merged or removed)

| Keep                              | Delete / redirect                                              |
|-----------------------------------|----------------------------------------------------------------|
| `/instructor/settings/account`    | `/instructor/profile` (AccountHub), `InstructorProfileDesktop`, `InstructorSettings.tsx`, `/instructor/menu`, `/settings/profile` |
| `/instructor/settings/schedule`   | `/instructor/availability`, `/instructor/availability-windows` (moved into Schedule section, original routes 301 → settings) |
| `/instructor/settings/integrations` | `/instructor/integrations` (now lives in settings)            |
| `/instructor/settings/comms`      | `/instructor/settings/whatsapp`, `/instructor/settings/call-answering`, `/instructor/settings/notifications`, `/instructor/famulor` |
| `/instructor/settings/business`   | `/instructor/settings/terms`, `/instructor/branding`, `/instructor/website/my-site` |
| `/instructor/money`               | merges `/instructor/pay`, `/instructor/income`, `/instructor/expenses`, `/instructor/tax`, `/instructor/accounts`, `/instructor/billing` under tabs |

All deleted routes get a `<Navigate replace>` to their new home so existing bookmarks, deep links, push notifications, and emails keep working.

## Build order

1. **Shared primitives** — `SettingsLayout` (two-pane shell), `SettingsCategoryList`, `SettingsSection`, `SettingsField`, `SettingsToggleRow`, `SettingsSaveBar`, `useSettingsForm` hook (dirty tracking + save + toast).
2. **New routes** — add `/instructor/settings` (index = category list) and `/instructor/settings/:categoryId` (renders matching section). Wire the 5-hub bottom nav + desktop sidebar to point at the 5 routes only.
3. **Rebuild each category panel** using existing form logic from current pages — copy the working save handlers, drop the old layouts. Order: Account → Business → Bookings → Schedule → Vehicle → Comms → Integrations → Advanced.
4. **Money hub** — new `/instructor/money` with sub-tabs (Income / Expenses / Tax / Plan). Existing pages become tab panels, not separate routes.
5. **Cleanup pass** — delete `InstructorMenu.tsx`, `AccountHub.tsx`, `InstructorProfileDesktop.tsx`, `InstructorProfileRouter.tsx`, `InstructorSettings.tsx`. Add redirects for every removed path.
6. **QA** — visit every category on mobile (375px) and desktop (1280px); confirm save→toast→DB roundtrip on at least one field per section; confirm all 30+ old URLs redirect.

## Out of scope

- No backend / RLS work (already fixed in previous loop).
- No changes to Today / Schedule / Pupils internal pages beyond moving availability into Settings.
- No mobile Drive365 (pupil) portal changes.
- No new features — this is purely IA + Settings rebuild.
