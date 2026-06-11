## Why the Profile page is blank
Your `kenneth@dufosse.co.uk` login is correctly linked to the "Ken D" instructor record and all profile fields are populated in the database. The page is blank because the Settings hub renders before the auth context finishes loading your instructor row, so it passes an empty `instructorId` down to the Profile editor. The editor's data fetch is guarded by `if (!instructorId) return`, so nothing loads and the form keeps its empty defaults.

## Fix
Gate the Settings hub on the auth context's `loading` flag and on having a real `instructor.id` before mounting any child that takes `instructorId` as a prop.

### Changes
1. **`src/pages/instructor/InstructorSettingsHub.tsx`**
   - Pull `loading` from `useInstructorAuth()` alongside `instructor`.
   - While `loading` is true, render a centered spinner inside `InstructorPortalLayout` instead of `SettingsShellV3` / `SettingsLayout`.
   - After loading, if `instructor?.id` is missing (auth user with no linked instructor row), show a clear "No instructor profile linked to this account" message with a contact-support note — never render the editors with an empty id.
   - Only when `instructor?.id` exists, render `SettingsShellV3 instructorId={instructor.id}` (desktop) or the mobile `SettingsLayout`.

2. **`src/components/instructor/settings/profile-v2/ProfileSettingsDesktop.tsx`** (defensive)
   - Keep the existing `if (!instructorId) return;` guard but, when `instructorId` is falsy on mount, leave `loading=true` (already true) so a spinner shows rather than the empty form. No behavioural change when an id is present.

### What this will not change
- No DB / RLS / auth changes — the data and policies are already correct.
- No edits to mobile layouts beyond the empty-id guard above (per project rule).
- No change to the login flow that was fixed earlier.

### How we'll verify
- Reload `/instructor/settings` while logged in as kenneth@dufosse.co.uk → spinner briefly, then the Profile tab shows name "Ken D", email `info@drive365.co.uk`, phone `07944671881`, bio, postcode `SO30 2TD`, vehicle Toyota Yaris Automatic, etc.
- Console shows `[InstructorAuth] instructor profile fetch finished found: true` once, no loops.
