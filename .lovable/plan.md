# Test Swap — Settings & Profile (Drive365 / Pupil Portal)

Translates the React Native spec to the existing web pupil portal (`BrandedPupilPortal.tsx` shell + `PupilPortalProfileEdit.tsx` + `GroupedNavMenu.tsx`). Uses Supabase + React Query (no Redux). Touches no existing fields/sections except by **insertion**.

## Scope

### 1. Database — `pupil_swap_profile`

Migration (one row per pupil):

- `id` uuid PK
- `pupil_id` uuid unique not null (FK pupils)
- `instructor_id` uuid not null (FK instructors)
- `opted_in` bool default false
- `email_notifications` bool default true
- `sms_notifications` bool default false
- `test_date` date null
- `test_time` time null
- `test_centre` text null
- `preference` text default 'earlier' (check: earlier|later|any)
- `consent_given` bool default false
- `consent_timestamp` timestamptz null
- `created_at`, `updated_at` (trigger updates `updated_at`)

RLS: pupils can read/write their own row (matched via existing pupil-auth RLS pattern using `pupil_id`); instructor can read pupils they own. Mirrors policies on `booking_test_swap_optins`.

### 2. New components

- `src/components/pupil-portal/SwapSettingsPanel.tsx` — full SwapSettings translated to Tailwind/shadcn:
  - Header bar with back chevron, "Test swap" title, "Active" pill (`bg-[#E1F5EE] text-[#085041]`) when opted in.
  - **Toggles card**: Join swap network (primary), Email notifications, SMS notifications. Sub-toggles disabled + `opacity-40` when `optedIn === false`. Turning main toggle off **also** sets email + SMS to false.
  - **Test details form** (only when opted in): test date, test time, test centre, preferred swap (`Select`: earlier / later / any). Save button → upserts row, shows "Saved" for 2s then reverts.
  - **Privacy note** card with lock icon and exact copy from spec (no booking reference shared).
  - **Leave swap network** destructive link (only when opted in) → opens `AlertDialog` (shadcn `Alert` substitute) with Cancel + Leave network → clears opt-in + both notification toggles.
  - Spacing exactly as spec (14px gutters, 14px card padding, 10px field gap, 4px label margin, 9px input padding). Colours from spec verbatim (`#1A52A0`, `#E6F1FB`, `#F1EFE8`, `#D3D1C7`, `#5F5E5A`, `#2C2C2A`, `#A32D2D`).
  - Accepts `pupilId` + `onClose` props; manages local form state, persists via `supabase.from('pupil_swap_profile').upsert(...)` with `consent_timestamp = new Date().toISOString()` set when consent box is ticked.

- `src/components/pupil-portal/SwapProfileRow.tsx` — small profile card row for the bottom of `PupilPortalProfileEdit`:
  - Swap icon (lucide `Repeat`), "Test swap" label, sublabel ("Active — showing your slot" / "Not joined"), green "Active" badge when opted in, chevron right.
  - `onClick` opens `SwapSettingsPanel` (sheet/dialog).

- `src/components/pupil-portal/SwapNotificationsRow.tsx` — "Test swap alerts" notifications card inserted at bottom of `PupilPortalProfileEdit` (the spec's Settings → Notifications surrogate). Same opens-panel behaviour.

- `src/components/pupil-portal/SwapNeedsAttentionBanner.tsx` — dashboard banner:
  - Renders only when `hasTestBooked === true && optedIn === false`.
  - Icon tile `bg-[#E6F1FB] text-[#1A52A0]`, left band `bg-[#1A52A0]`, label "Join test swap network", subtitle "Find learners to swap test slots with".
  - Full-width row inserted at the very top of the dashboard area.

### 3. Wiring (insert-only edits)

- **`src/components/pupil-portal/PupilPortalProfileEdit.tsx`**: append `<SwapProfileRow />` and `<SwapNotificationsRow />` at the end of the existing form. No existing fields or rows touched.
- **`src/components/pupil-portal/GroupedNavMenu.tsx`**: append a new menu entry "Test swap" in the appropriate existing group; clicking opens the SwapSettingsPanel via a callback.
- **`src/pages/BrandedPupilPortal.tsx`**:
  - Add `swapPanelOpen` state + sheet/dialog rendering `SwapSettingsPanel`.
  - Pass an `onOpenSwapSettings` handler into `GroupedNavMenu`, `PupilPortalProfileEdit`, and the new banner.
  - Insert `<SwapNeedsAttentionBanner />` at the top of the dashboard view; derive `hasTestBooked` from existing pupil state (`pupil.test_date` / `practical_test_date`, whichever exists — fall back to `false` if absent, surfacing nothing rather than a fake state).
  - Read `swapProfile` once via React Query (`['pupilSwapProfile', pupil.id]`) → drives sublabels, badges, and banner gating across all three entry points.

### 4. Hard constraints honoured

- No existing profile/settings sections are modified — entries are appended.
- Email/SMS toggles disabled + dimmed when not opted in.
- Turning off main toggle clears email + SMS in same update.
- Leave network shows confirmation dialog before clearing.
- No booking reference shared anywhere; copy matches spec.
- No new libraries — uses existing shadcn `Switch`, `Input`, `Select`, `Sheet`, `AlertDialog`, lucide icons.
- `saved` resets after 2s.
- Banner only renders under the documented condition.

## Files

**New**
- `supabase/migrations/<timestamp>_pupil_swap_profile.sql`
- `src/components/pupil-portal/SwapSettingsPanel.tsx`
- `src/components/pupil-portal/SwapProfileRow.tsx`
- `src/components/pupil-portal/SwapNotificationsRow.tsx`
- `src/components/pupil-portal/SwapNeedsAttentionBanner.tsx`

**Edited (insert-only)**
- `src/components/pupil-portal/PupilPortalProfileEdit.tsx`
- `src/components/pupil-portal/GroupedNavMenu.tsx`
- `src/pages/BrandedPupilPortal.tsx`

## Out of scope

- Matching engine / notification dispatch (UI-only opt-in; existing `notify-test-swap-match` edge function is untouched).
- Mobile-only native screens.
- Any change to `booking_test_swap_optins` (prompt 2's table).
