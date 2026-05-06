## Goal

Match the EMIS "Find appointments" look-and-feel for the cross-portal slot search, expose it from a new sidebar entry under **Diary** in the instructor desktop portal (and from the equivalent place in the admin and school portals), and retire the old "Slot Finder" / "Find appointment" entries that already exist.

## Scope

- Instructor desktop portal (`DashboardSidebar.tsx` + legacy `InstructorDesktopSidebar.tsx`)
- Admin desktop portal (`AdminLayout.tsx` / `AdminDesktopSidebar.tsx`)
- School desktop portal (`SchoolLayout.tsx`)
- Shared modal: `src/components/shared/FindAppointmentModal.tsx`
- Page: `src/pages/InstructorTestSlotFinder.tsx` (delete) and route in `instructorPortalRoutes.tsx`

Mobile layouts are explicitly out of scope (per project rule).

## Visual redesign of the Find Appointment screen

Restyle `FindAppointmentModal` to match the EMIS screenshot while staying on our design tokens:

```text
┌──────────────────────────────────────────────────────────────────┐
│ Find appointments                                            [X] │
├──────────────────────────────────────────────────────────────────┤
│ Pupil banner (name • DOB • status)                               │
├──────────────────── Appointment criteria ────────────────────────┤
│ Search from [date]    Urgents  ◉ Include ○ Exclude ○ Urgent only │
│ Time of day [Any ▾]   For      ◉ Specific instructor(s)  [list]  │
│ Slot type   [All ▾]            ○ Filter [All instructors  ▾]     │
│ Languages   [All ▾]                                              │
│ Location    [Practice 1 ▾]                          [Advanced]   │
├──────────────────── Available appointments ──────────────────────┤
│ Date        At     Dur    Instructor    Slot type    Location    │
│ Mon 20-Apr  10:30  60m    Smith, J      Default      Winchester  │
│ ...                                                              │
│                       Earlier appointments | Later appointments  │
├──────────────────────────────────────────────────────────────────┤
│ [Clear criteria]                  [Cancel]   [Book appointment]  │
└──────────────────────────────────────────────────────────────────┘
```

Token rules: dense rows (32 px), zebra striping, sticky header, alternating row hover, primary highlight on the selected row, EMIS-style two-pane layout (criteria card on top, results card below). Use `--portal-*` tokens, rounded-2xl wrapper, no hardcoded colours. Move Postcode/Search-window into "Advanced criteria" so the default panel matches the screenshot's compactness.

The data source stays `useInstructorAvailabilitySearch`; we add `slotType` and `language` filters as no-op pass-throughs initially (UI only) so we don't break existing behaviour.

Add a thin shared route wrapper so the modal can also be opened as a full page (the instructor portal opens it as a full screen; admin/school keep using the existing modal trigger):

- `src/pages/shared/FindAppointmentPage.tsx` – renders `FindAppointmentModal` content inside the portal layout (no Dialog chrome).

## Sidebar wiring

### Instructor desktop (`DashboardSidebar.tsx`)
- Add a new item directly under **Diary** in the *Overview* section:
  - `{ label: "Find appointment", to: "/instructor/find-appointment", icon: CalendarSearch }`
- Remove the existing `Slot Finder` row in the *Teaching* section.

### Instructor legacy sidebar (`InstructorDesktopSidebar.tsx`)
- Same swap: drop the `Slot Finder → /instructor/test-slot-finder` line and add `Find appointment → /instructor/find-appointment` near the top.

### Admin (`AdminLayout.tsx` / `AdminDesktopSidebar.tsx`)
- Keep the existing `find-appointment` section but ensure its label/icon match the new wording. Remove any duplicate "Slot Finder" entry if present (none found, but verify on render).

### School (`SchoolLayout.tsx`)
- Same: keep the single `find-appointment` entry, remove duplicates.

## Routing

`src/routes/instructorPortalRoutes.tsx`:
- Remove the `InstructorTestSlotFinder` lazy import and its `<Route path="/instructor/test-slot-finder" ...>`.
- Add `<Route path="/instructor/find-appointment" element={<FindAppointmentPage />} />`.

Delete `src/pages/InstructorTestSlotFinder.tsx`.

`ModulesContext.tsx`:
- Rename module id from `slotfinder` / "Slot Finder" → "Find appointment" (keep id stable to avoid migrations); update the description.

## Technical details

- `useInstructorAvailabilitySearch` already returns the rows we need; we extend the `AvailableSlot` interface only if Slot type/Location columns require new fields — otherwise we render `slot.carType` as "Slot type" and a derived "Location" from `postcodeArea`.
- The full-page wrapper passes `mode="instructor"` and uses `instructorIds=[currentInstructor.id]`, so each portal sees the right scope.
- No DB migrations.
- No mobile changes.

## Files touched

- Edit: `src/components/shared/FindAppointmentModal.tsx`
- Add: `src/pages/shared/FindAppointmentPage.tsx`
- Edit: `src/components/instructor/dashboardV2/DashboardSidebar.tsx`
- Edit: `src/components/instructor/InstructorDesktopSidebar.tsx`
- Edit: `src/components/admin/AdminLayout.tsx` (label tidy-up only)
- Edit: `src/components/school/SchoolLayout.tsx` (label tidy-up only)
- Edit: `src/routes/instructorPortalRoutes.tsx`
- Edit: `src/context/ModulesContext.tsx`
- Delete: `src/pages/InstructorTestSlotFinder.tsx`

## Out of scope

- Mobile portal nav
- Backend availability logic changes
- Pupil banner data wiring (placeholder for now — shows current selected pupil if one is in context, otherwise hidden)
