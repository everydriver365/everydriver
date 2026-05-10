## Why

The Account category at `/instructor/settings/account` currently has only 3 sections (Profile & contact, Qualifications, Vehicle docs & CPD). Things that belong to "your account" are scattered across the legacy `AccountHub`, the dashboard profile page, and other settings categories — which is why it feels disjointed.

This plan keeps the unified Settings hub as the single home and folds the missing pieces into the **Account** category in a logical order, without duplicating editors that already live in Business / Bookings / Comms.

## New Account section list (replaces the current 3)

```
Account
├── 1. Profile & contact details        (existing — Photo, name, email, phone, bio + extended details tabs)
├── 2. Profile media                    (NEW — banner image, car photo, welcome video, ADI certificate)
├── 3. Qualifications & credentials     (existing — ADI badge, DBS, licence, insurance docs)
├── 4. DVSA Standards Check             (NEW here — date/time, result, trigger points, link)
├── 5. Vehicle docs & CPD               (existing — MOT, road tax, CPD logging)
├── 6. Login & security                 (NEW — change email, change password, sign out everywhere)
└── 7. Plan, data & danger zone         (NEW — link to Plan & Billing, data export, delete account)
```

Total: 7 sections, all answering the question "is this about *me* and *my* account?". Operational settings (terms, payments, schedule, comms, website) stay in their existing categories.

## What each new/moved section reuses

| Section | Component used | Source |
|---|---|---|
| Profile media | `CMSImageUpload` × 3 + welcome video input | already used in `AccountHub.tsx` "Media" tab |
| DVSA Standards Check | `CompactStandardsCheck` (already updated last turn with date/time/result/trigger points) | currently shown on profile page only |
| Login & security | New small component `AccountSecurityPanel` wrapping Supabase `updateUser({ email, password })` and `signOut({ scope: 'global' })` | new file |
| Plan, data & danger zone | Existing `<Link to="/instructor/billing">`, existing `DataExportManager`, new "Delete account" confirm dialog calling an edge function | partial reuse |

## Files to change

- `src/components/instructor/settings/categories.tsx` — extend the `account` category's `sections` array with the four new entries in the order above.
- `src/components/instructor/ProfileMediaEditor.tsx` (NEW) — extracts the Media tab markup from `AccountHub.tsx` into a self-contained component taking `{ instructorId }`.
- `src/components/instructor/AccountSecurityPanel.tsx` (NEW) — change email, change password, sign out of all devices.
- `src/components/instructor/AccountDangerZone.tsx` (NEW) — Plan & Billing link, Data export reuse, Delete account dialog.
- (Optional) `src/pages/instructor/AccountHub.tsx` — leave the legacy page in place for now; once the user confirms the new hub is complete we can remove it in a follow-up.

No database migrations required — every field already exists on `instructors` / `auth.users`.

## Out of scope

- Removing or renaming the other 7 categories (Business, Bookings & Payments, Schedule, Vehicle & Tracking, Communication, Website, Advanced).
- Mobile layout changes (per project rule, only desktop wiring is touched).
- Any changes to existing components' internals.

## Open question

Section 7 includes "Delete account". This needs a server-side edge function to cascade-delete (or anonymise) the instructor and their data. Do you want me to:
- **A.** Build it now (adds an edge function + confirm-by-typing dialog), or
- **B.** Ship sections 1–6 first and add Delete account in a follow-up?
