## Problem

The toggle and "Max hours per week" input in **Book first lesson only** don't save, and you think the feature isn't wired into the booking flow. Root cause is a single bug — the booking flow itself **is** already wired, but it only appears when the toggle is on. Since the toggle never saves, the booking tab never shows up, so it looks like nothing works.

### Why nothing saves

`StartDateOnlyBookingEditor` doesn't have its own Save button. It registers a `save()` callback with a shared `SettingsDirtyContext` so the parent settings shell can call it from a global "Save changes" bar.

- **Desktop (V3 settings shell):** wrapped in `SettingsDirtyProvider` → save callback fires from the global save bar. Works.
- **Mobile (`InstructorMenu.tsx` sheet):** the editor is rendered raw, with no `SettingsDirtyProvider` and no save bar. `useOptionalSettingsDirty()` returns no-ops, so `save()` is never called → the toggle and the number you type into "Max hours per week" stay in local React state and are thrown away when you close the sheet.

That single bug is also why the booking flow appears "not wired" — `BookingModeTabs` (already mounted in `src/pages/BookingSummary.tsx` and `src/pages/everydriver/BookingSummary.tsx`) reads `allow_start_date_only_booking` from `instructor_booking_settings`. Because the toggle never persists, the second tab never appears on the pupil's checkout.

## Fix

### 1. `src/components/instructor/StartDateOnlyBookingEditor.tsx`

Make the editor self-saving when it's used outside a `SettingsDirtyProvider`:

- Detect whether a real provider is present (the optional hook already returns the same shape — we'll check if `register` is the no-op by reading the raw context directly).
- When no provider is present, render a small inline **Save** button beneath the controls that calls `save()` directly, with disabled/loading state and toast on success.
- When a provider **is** present (desktop V3), keep the current registry-based behaviour unchanged so the global save bar still works.
- Also write each change immediately on toggle change is an option, but a Save button matches the rest of the mobile sheet pattern (e.g. profile editor in the same file uses "Save Profile"). Use the Save button.

### 2. Verify the cap is honoured in checkout

No code change expected, just a verification pass after fixing #1:

- `src/components/booking/BookingModeTabs.tsx` already reads `allow_start_date_only_booking` and `start_date_only_max_hours_per_week` and passes the cap into `StartDateOnlyBookingPanel` as `maxHoursPerWeekCap`.
- `src/components/booking/StartDateOnlyBookingPanel.tsx` already uses that cap for the slider max (`maxSlider = maxHoursPerWeekCap ?? 40`) and surfaces "(instructor cap Xh)" in the label.
- `supabase/functions/create-course-reservation/index.ts` already re-runs the capacity check server-side.

Once the toggle and cap actually persist, the second tab will appear in the pupil booking flow on both `/booking-summary` paths and the cap will limit the slider — no further wiring needed.

### 3. Out of scope

- Desktop V3 path: already working via `SettingsShellV3` → no changes.
- Edge function and capacity check logic: already wired and correct.
- BookingSummary integration: already mounted.

## Result

- Mobile: toggling **Book first lesson only** and entering a max-hours value will save (Save button + toast), and persist to `instructor_booking_settings`.
- Pupil checkout: once enabled, the "Reserve start date only" tab appears in `BookingSummary`, with the slider capped by the instructor's configured max-hours-per-week.
