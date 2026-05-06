## Goal

When you click any item in the instructor sidebar, the destination page should open inside the same shell (sidebar + top bar visible) — exactly like `/instructor/pupils` does today. Currently several sidebar links either:

1. Navigate to pages that render their own full-screen UI without wrapping in `InstructorPortalLayout` / `DashboardShell` (so the sidebar disappears).
2. Point at routes that aren't registered, causing a blank/404 view.

## Pages that need to be wrapped in the portal shell

These render content but no shell, so the sidebar vanishes when you click them:

- `src/pages/InstructorTakePayment.tsx` (Take Payment)
- `src/pages/InstructorWaitingList.tsx` (Waiting List)
- `src/pages/InstructorReferrals.tsx` (Referrals)
- `src/pages/instructor/CoursePlannerPage.tsx` (Course Planner)
- `src/pages/InstructorStandardsCheck.tsx` (Standards Check)
- `src/pages/instructor/InstructorBrandingPage.tsx` (Branding)
- `src/pages/instructor/InstructorIntegrationsHub.tsx` (Integrations)
- `src/pages/instructor/AccountHub.tsx` (Profile)
- `src/pages/InstructorFleetMap.tsx` (Fleet Map)
- `src/pages/instructor/InstructorFamulorPage.tsx` (AI Voice Hub)

Fix: wrap each page's top-level return in `<InstructorPortalLayout>…</InstructorPortalLayout>` (matches the pattern used by Pupils, Diary, Pay, etc.). For pages that already render a full-bleed layout (e.g. Fleet Map), keep the inner layout intact and only add the wrapper.

## Sidebar links pointing at non-existent routes

These currently 404 / render blank. Either remove the link or register the route so it opens inside the shell.

- `Test Bookings` → `/instructor/test-bookings` — no route registered. Decision: remove the sidebar item (no page exists yet).
- `Test Swap` → `/instructor/test-swap` — sidebar uses `test-swap`, but the actual route is `/instructor/test-requests`. Fix: update the sidebar entry's `to` to `/instructor/test-requests`.
- `Invoices` → `/instructor/invoices` — no route. Decision: remove the sidebar item.
- `SEO` → `/instructor/seo` — no route. Decision: remove the sidebar item.

(All three removed items are gated by `moduleId` already, but the link itself is broken regardless. Removing them keeps the sidebar honest until those pages exist.)

## Files to edit

```text
src/components/instructor/dashboardV2/DashboardSidebar.tsx
  - remove Test Bookings, Invoices, SEO entries
  - change Test Swap `to` from "/instructor/test-swap" to "/instructor/test-requests"

src/pages/InstructorTakePayment.tsx
src/pages/InstructorWaitingList.tsx
src/pages/InstructorReferrals.tsx
src/pages/instructor/CoursePlannerPage.tsx
src/pages/InstructorStandardsCheck.tsx
src/pages/instructor/InstructorBrandingPage.tsx
src/pages/instructor/InstructorIntegrationsHub.tsx
src/pages/instructor/AccountHub.tsx
src/pages/InstructorFleetMap.tsx
src/pages/instructor/InstructorFamulorPage.tsx
  - import InstructorPortalLayout
  - wrap the page's root return value with <InstructorPortalLayout>…</InstructorPortalLayout>
```

## Out of scope

- Mobile layout (mobile branch in `InstructorPortalLayout` already preserves its own chrome — no changes per the mobile-update policy).
- Visual restyling of the affected pages — only the layout wrapper is added.
- Pages that already use `DashboardShell` directly (Schedule Desktop, My Site, Plan & Billing, Modules) — they stay as-is.

## Verification

After the change, clicking every item in the desktop sidebar should keep the sidebar and top bar visible, with only the main content area swapping — matching the Pupils page behaviour.
