## Goal
Bundle the disjointed Profile / Vehicle / Images / Compliance / Billing settings into a single tabbed **Account** hub at `/instructor/profile` so instructors have one predictable place for "everything about me".

## New page: `src/pages/instructor/AccountHub.tsx`
A single tabbed page with 5 tabs:

| Tab | Contents | Source of truth |
|---|---|---|
| Profile | Avatar, name, email, phone, bio | `instructors` table — same fields as the current Profile tile |
| Vehicle & ADI | Car details, qualifications, social links | Reuse existing `<InstructorDetailsEditor />` |
| Media | Banner, car photo, welcome video URL, ADI certificate | Same uploads as the current Images tile |
| Compliance | Insurance, MOT, CPD hours | Reuse existing `<ComplianceTracker />` |
| Plan & Billing | Subscription summary + button to open `/instructor/billing` | Link out (page is heavy, keep separate) |

- Tab state is mirrored to `?tab=…` so deep links work (`/instructor/profile?tab=media`).
- Uses the instructor portal design tokens (`rounded-2xl`, `bg-card`, `--d2-bg`).
- Reuses `useInstructorAuth`, `CMSImageUpload`, and the existing avatar-upload logic from `InstructorMenu.tsx`.

## Routing
- Add a new route `/instructor/profile` → `AccountHub` in `src/routes/instructorPortalRoutes.tsx`.
- Keep `/instructor/settings` (legacy redirect) and `/instructor/menu` working as-is — the menu page still lists every other setting tile, just no longer the "front door" for identity.

## Sidebar wiring
Update `DashboardSidebar.tsx`:
- **Profile** entry → `/instructor/profile` (currently `/instructor/settings`).

## Menu cleanup (`src/pages/InstructorMenu.tsx`)
Remove the now-duplicated tiles from `allTiles`:
- `profile`, `details`, `images`, `compliance`
Add a single replacement tile at the top of the `profile` category:
- **Account** → links to `/instructor/profile`.

The existing render handlers for those four tiles can stay (used by deep-link `?open=`) but they're no longer surfaced in the grid.

## Out of scope
- No mobile changes (`InstructorProfileRouter` / `InstructorProfileDesktop` untouched per mobile-update policy).
- No schema changes.
- No edits to the Plan & Billing page itself — just linked to.
