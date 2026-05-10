## Goal

Add a "Quick settings" entry at the top of the new settings sidebar that opens a single page of high-frequency toggles and dials — the things instructors flip on and off between lessons, not the things they configure once.

## Sidebar change

A new group sits above "Account":

```text
Quick settings
  └─ Today's controls    (icon: bolt)

Account
  ├─ Profile
  ...
```

Single item, route id `quick`. Tabler `IconBolt` at 16px, same active-card treatment as the rest.

## Page content — `QuickSettingsPage`

One scrollable page, four cards, each a tight list of `sv2-row` toggles/buttons. No mid-form save buttons — every change writes through immediately (this is the one exception to the sticky-save-bar rule, because these are "do it now" toggles, like a phone Control Centre). A small toast confirms each change.

```text
┌─ Status ──────────────────────────────────────────────┐
│ Available for new bookings        [toggle] live       │
│ Pause public listing              [toggle] visible    │
│ Snooze notifications              [Off ▾] 1h / 4h / Until tomorrow │
└───────────────────────────────────────────────────────┘

┌─ Today ───────────────────────────────────────────────┐
│ Working hours today               7:00–18:00  [Edit] │
│ Block the rest of today           [Block today]       │
│ Add a one-off slot                [Add slot]          │
└───────────────────────────────────────────────────────┘

┌─ Bookings & calls ────────────────────────────────────┐
│ Pupil self-service booking        [toggle]            │
│ AI call answering                 [toggle]            │
│ Divert calls to voicemail         [toggle]            │
└───────────────────────────────────────────────────────┘

┌─ Tracking & vehicle ──────────────────────────────────┐
│ Live GPS tracking                 [toggle]            │
│ Auto-record routes                [toggle]            │
│ Share location with current pupil [toggle]            │
└───────────────────────────────────────────────────────┘
```

## Data wiring

All toggles map to existing `instructors` columns or existing settings rows — no schema changes:

- **Available for new bookings** → `instructors.accepting_bookings` (or equivalent existing column; fall back to `is_active` if not present).
- **Pause public listing** → `instructors.public_listing_visible` (existing field used by mini-website).
- **Snooze notifications** → `instructor_notification_settings.quiet_hours_*` (one-shot end time written to `quiet_hours_end`, with `quiet_hours_enabled = true`).
- **Working hours today** → reads today's row from existing working hours; "Edit" opens `/instructor/settings/availability`.
- **Block the rest of today** → inserts a `holiday_block` from `now()` to end-of-day in the existing blocks table.
- **Add a one-off slot** → opens existing slot dialog (link to availability for now).
- **Pupil self-service booking** → flag used by `PupilBookingSettingsEditor`.
- **AI call answering** → existing Famulor inbound toggle.
- **Divert calls to voicemail** → existing call-divert flag used by `CallAnsweringSettings`.
- **Live GPS tracking** → `instructors.gps_tracking_enabled`.
- **Auto-record routes** → existing `auto_record_routes` flag.
- **Share location with current pupil** → existing per-lesson share flag, scoped to the current in-progress lesson if any (disabled with helper text otherwise).

I'll use a small `useQuickSettings(instructorId)` hook that reads/writes these in one place. Anything that isn't actually present in the schema gets rendered as disabled with a "Not configured" helper instead of failing.

## Components

- `src/components/instructor/settings/pages/QuickSettingsPage.tsx` — the page.
- `src/components/instructor/settings/QuickToggleRow.tsx` — small reusable row (icon, label, meta, toggle, optional secondary action).
- `src/hooks/useQuickSettings.ts` — load + write helpers, wraps existing tables.

## Sidebar wiring

`SettingsSidebar.tsx`: prepend a new group `{ id: "quick", label: "Quick settings", items: [{ id: "quick", label: "Today's controls", icon: IconBolt }] }`.

`SettingsLayoutV2.tsx`: add `quick` to `PAGES` with title "Quick settings" and subtitle "Toggles you change often. Changes save automatically.".

## Out of scope

- Mobile (project rule).
- Adding a global header shortcut (sidebar entry only for this pass).
- Schema changes — only existing columns/tables are touched.

## File list

- add `src/components/instructor/settings/pages/QuickSettingsPage.tsx`
- add `src/components/instructor/settings/QuickToggleRow.tsx`
- add `src/hooks/useQuickSettings.ts`
- edit `src/components/instructor/settings/SettingsSidebar.tsx` — add Quick settings group
- edit `src/components/instructor/settings/SettingsLayoutV2.tsx` — register the page
