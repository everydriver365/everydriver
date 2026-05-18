# Settings audit & fix — all portals

## Goal
Every settings entry-point (sidebar item, tile, deep link) must:
1. Land on the correct panel (no fallback to Profile / blank / "mess"),
2. Persist edits (Save button works, dirty-bar appears where applicable, toast confirms, value re-reads after refresh),
3. Behave identically on desktop and mobile.

Plus: wire up the Admin and School settings panels that exist but are mis-linked or non-saving.

## Phase 1 — Inventory (read-only sweep)
Build one checklist per portal capturing: link → expected panel → actual panel → save behavior → mobile parity.

**Instructor (V3 hub at `/instructor/settings/*`)** — 17 area items already mapped in `areas.tsx`:
You: profile, login-security · Teaching: credentials, working-hours, rates-coverage · Money: how-pupils-book, payments, discounts-packages · Comms: notifications, phone-ai, messaging · Website: mini-site, branding · System: appearance-layout, plan-billing, data-privacy, help-close, lab-features.
Plus dedicated routes outside the hub: `/instructor/settings/gps`, `/instructor/settings/whatsapp`, `/instructor/settings/gps-tracking`.

**Admin (`/admin` single-page with `activeSection` switch)** — settings-flavored sections: `site-settings`, `commission-settings`, `rewards-config`, `pwa-apps`, `admin-notes`, `trackers`, `calendar-sync`, plus all `*-audit` pages already on real routes.

**School (`/school/dashboard` single-page with `activeSection`)** — settings-flavored sections: `profile`, `branding`, `booking-page(s)`, `notifications`, `payment-gateways`, `bnpl`, `franchise-fees`, `subscription`, `website`, `compliance`, `discount-codes`, `ai-voice`.

**Pupil (Drive365)** — no `/pupil/settings/*` route exists today. Pupil preferences live inline in the pupil app. Verify the in-app "Profile / Account / Notifications" sections save correctly; do not add new routes.

## Phase 2 — Fixes
Group fixes into categories and apply per portal:

### A. Routing
- For each broken link found in Phase 1, repoint to the canonical slug (extend `LEGACY_ID_MAP` if external sources still use the old slug, or update the source).
- Ensure mobile sidebar/menu uses the same slug list as desktop (single source of truth → `InstructorPortalLayout` items array already unified last loop; verify mobile drawer & quick-tiles consume it).
- For Admin/School: if a sidebar item maps to a `case` that's missing or rendering the wrong component, fix the switch in `AdminPortal.tsx` / `SchoolPortal.tsx`.

### B. Save behavior
Standard contract for every editor:
- Uses `useOptionalSettingsDirty` (instructor V3) **or** has its own visible Save button (Admin/School/Pupil).
- `save()` writes to DB, awaits success, shows success toast, clears dirty state, re-reads to confirm.
- Error path shows error toast; dirty state is preserved.

Pass through every editor component and confirm or add the missing pieces. Common gaps to look for:
- `setDirty` called on change but `register` never called (Save bar never fires).
- Local `useState` not seeded from query data → "Save" persists stale values.
- `onClick={save}` not `onClick={() => void save()}` causing unhandled promise.
- Missing `onSuccess` invalidation → UI keeps old value until refresh.

### C. Mobile parity
- For each instructor area, open the same slug at 390×844 and confirm the editor renders (not the landing grid), the Save bar is reachable above the bottom nav, and inputs aren't clipped.
- Admin/School portal layouts already responsive — confirm the section switch fires from the mobile drawer.

### D. Runtime
- Fix the current "Rendered more hooks than during the previous render" error surfacing in preview (likely in one of the settings panels touched last loop). Locate via stack and stabilize hook order.

## Phase 3 — Verification
Drive a scripted browser pass:
- Desktop 1366×768 and mobile 390×844.
- For each entry: navigate → edit one field → save → reload → confirm persisted.
- Capture pass/fail in a final report posted in chat.

## Technical details
- Source of truth for instructor area slugs: `src/components/instructor/settings/v3/areas.tsx` + `categories.tsx`. Don't fork.
- Legacy slug compatibility: keep `LEGACY_ID_MAP` + `<Navigate>` redirects in `InstructorSettingsHub`.
- Admin/School portal switches: `src/pages/AdminPortal.tsx` ~lines 819+, `src/pages/SchoolPortal.tsx` ~lines 90–172. Each `case` must render the matching manager component; add missing imports.
- Dirty bar: `SettingsDirtyContext` + `SettingsSaveBar` (instructor only). Admin/School editors keep their own per-form Save buttons — do not retrofit dirty bar there.
- All DB writes go through existing hooks/services; no schema changes expected in this sweep.
- Respect memory rules: LIVE DATA ONLY (no fallbacks), Service Fee naming, payment-gateway allowlist, mobile layout untouched unless a bug forces it.

## Out of scope
- New settings pages or redesigns.
- Pupil portal settings routing (none exists today; only verify inline editors save).
- Schema migrations.

## Deliverable
- Working Save on every settings panel across the 4 portals at desktop + mobile.
- Final chat report: table of `portal · panel · status` (✅ / fixed / N/A).
