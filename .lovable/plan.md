## Goal

Re-skin `/instructor/settings/*` to a quiet, Stripe/Linear-style admin surface. Same React app, same editors, same routes — new shell + new look. Mobile is untouched (per project memory).

## Design tokens (new, scoped to `.settings-v2`)

Add to `src/index.css` under a `.settings-v2` selector so the rest of the portal is unaffected:

```text
--color-background-primary: #ffffff
--color-background-secondary: #fafafa
--color-background-tertiary: #f4f4f5
--color-text-primary: #0a0a0a
--color-text-secondary: #52525b
--color-text-tertiary: #71717a
--color-border: rgba(0,0,0,0.08)            /* renders ~0.5px on retina */
--color-background-success: #ecfdf5  --color-text-success: #047857
--color-background-warning: #fffbeb  --color-text-warning: #b45309
--color-background-danger:  #fef2f2  --color-text-danger:  #b91c1c
--border-radius-md: 8px
--border-radius-lg: 12px
--font-weight-regular: 400
--font-weight-medium: 500
```

Two weights only (400 / 500). Sentence case throughout. No gradients, no shadows, no glows.

## Sidebar restructure — 4 groups

Reduce the current 8 categories down to the 4 the user asked for. Existing sections move; nothing is deleted.

```text
Account
  ├─ Profile               (ProfileBasicsEditor + InstructorDetailsEditor)
  ├─ Login & security      (AccountSecurityPanel — restyled, see below)
  └─ Notifications         (NotificationPreferencesPanel + PushNotificationSettings)

Teaching
  ├─ Vehicle               (vehicle slice of InstructorDetailsEditor + ComplianceTracker)
  ├─ Credentials           (QualificationsEditor + CompactStandardsCheck)
  ├─ Media & listing       (ProfileMediaEditor + listing preview link)
  ├─ Rates & coverage      (InstructorCoursesManager + PricingRulesSettings + coverage postcodes)
  └─ Availability          (WorkingHoursEditor + PupilBookingSettingsEditor + buffer/lesson length)

Activity
  ├─ CPD & training        (CPD slice of ComplianceTracker)
  ├─ Plan & billing        (link card → /instructor/billing)
  └─ Data export           (DataExportManager)

More
  ├─ Help & support        (mailto/link card)
  └─ Close account         (delete-account flow with confirm dialog)
```

The previous Business / Bookings / Schedule / Vehicle / Comms / Website / Advanced categories are kept reachable via a small "All other settings" link at the bottom of the new sidebar (so we don't lose features in this design pass — they get re-skinned in a follow-up).

## Shell rebuild — `SettingsLayoutV2`

New file `src/components/instructor/settings/SettingsLayoutV2.tsx`. The existing `SettingsLayout` is left in place for mobile. Hub picks the v2 shell on `md:` and up.

- 220px left sidebar, white background, group labels in 11px/500 uppercase-replacement (sentence case "Account" etc., not all caps), items as plain text rows in `--color-text-secondary`.
- Active item: white card, `--border-radius-md`, 0.5px border, `--color-text-primary`. Inactive: no background.
- Tabler outline icons at 16px via `@tabler/icons-react` (add dependency).
- Right pane: page header (20px/500 title, 13px subtitle), then white cards (`--border-radius-lg`, 0.5px border, `1.25rem 1.5rem` padding).

## Sticky save bar

New `SettingsSaveBar` component, shown when a `SettingsDirtyContext` reports unsaved changes. Bottom-right of the right pane, fixed, with Cancel + "Save changes" (dark filled). Editors register their dirty state + a `save()` callback via the context. Existing editors that already auto-save get wrapped with a thin adapter that exposes those handlers; that's a per-editor follow-up — for this pass, only the new pages (Login & security, Notifications, Media & listing, Rates & coverage, Availability, Plan & billing, Data export, Close account) are wired to the save bar.

## Removed mid-form buttons

`AccountSecurityPanel` is rewritten to:
- "Change email" row → opens confirm dialog → triggers `supabase.auth.updateUser({ email })`. No inline "Send confirmation" button.
- "Change password" row → opens confirm dialog with new password fields → triggers `updateUser({ password })`.
- "Sign out everywhere" row → confirm dialog → `signOut({ scope: "global" })`.
- Two-factor toggle (UI only for now, wired to a `tfa_enabled` flag on `instructors` if present, otherwise disabled with "Coming soon" pill).
- Active sessions list (read-only, "current device" badge — no API for others yet, so single-row).

## Status pills

New `StatusPill` component, three states only (success/warning/danger). Used in Credentials and Vehicle for cert/MOT validity, and in Plan & billing for subscription state. Format exactly per spec: `font-size: 11px; padding: 3px 8px; border-radius: 20px; font-weight: 500;` with Tabler `circle-check` / `alert-triangle` / `alert-circle`.

## List row pattern

New `SettingsListRow` (icon → name+meta → status pill → chevron). Used for Credentials documents, Vehicle docs, Data export rows, Plan invoice history.

## New page contents

- **Login & security** — email row, password row, sign-out-everywhere row, 2FA toggle, sessions list.
- **Notifications** — channel × event-type matrix (email / SMS / push × new booking, cancellation, payment, review, message) with master toggle per channel; backed by `instructor_notification_settings` (existing).
- **Media & listing** — keeps `ProfileMediaEditor` content but adds a "Preview public listing" button linking to the mini-website slug.
- **Rates & coverage** — hourly rate, block discounts, intensive pricing (uses `LessonPackageManager` data), coverage postcodes (multi-input chips), service radius (slider, miles).
- **Availability** — `WorkingHoursEditor` + holiday/blocked dates list + lesson length chips + buffer minutes number input.
- **Plan & billing** — current plan card, usage, payment method, invoice history list, upgrade/downgrade link.
- **Data export** — one row per dataset (pupils, lessons, schedule, financials) + "Full account backup (.zip)" row, all using `SettingsListRow`.
- **Close account** — warning copy, 7-day grace explanation, GDPR retention list, "Email support" + "Request closure" (confirm-by-typing dialog).

## Dependency

Add `@tabler/icons-react` (single small dep, tree-shakes per icon import).

## Out of scope

- Mobile layout (project rule).
- Re-skinning Business / Bookings / Schedule / Vehicle / Comms / Website / Advanced categories — they remain on the existing shell behind the "All other settings" link, to be migrated in a follow-up pass.
- Backend changes (no migrations).

## File list

- add `src/components/instructor/settings/SettingsLayoutV2.tsx`
- add `src/components/instructor/settings/SettingsSidebar.tsx`
- add `src/components/instructor/settings/SettingsSaveBar.tsx`
- add `src/components/instructor/settings/SettingsDirtyContext.tsx`
- add `src/components/instructor/settings/StatusPill.tsx`
- add `src/components/instructor/settings/SettingsListRow.tsx`
- add `src/components/instructor/settings/pages/LoginSecurityPage.tsx`
- add `src/components/instructor/settings/pages/NotificationsPage.tsx`
- add `src/components/instructor/settings/pages/MediaListingPage.tsx`
- add `src/components/instructor/settings/pages/RatesCoveragePage.tsx`
- add `src/components/instructor/settings/pages/AvailabilityPage.tsx`
- add `src/components/instructor/settings/pages/PlanBillingPage.tsx`
- add `src/components/instructor/settings/pages/DataExportPage.tsx`
- add `src/components/instructor/settings/pages/CloseAccountPage.tsx`
- edit `src/index.css` — add `.settings-v2` token block
- edit `src/pages/instructor/InstructorSettingsHub.tsx` — wrap in `.settings-v2` and use `SettingsLayoutV2` on desktop
- edit `src/components/instructor/settings/categories.tsx` — regroup into 4 categories, route the new pages
- add `@tabler/icons-react` dependency
