## Goal
Make every control on `/instructor/settings/working-hours` consistent: one sticky "Save all changes" bar, no orphaned inline Save buttons, no missing controls, no runtime hook errors.

## Scope (this page only)
1. **Working hours** (`WorkingHoursEditor`)
2. **Pupil self-service booking** (`PupilBookingSettingsEditor`)
3. **Google Calendar sync** (`GoogleServiceAccountSetup`) — leave as-is (action-driven, not a form)
4. **Lesson reminders** (`ReminderSettings`)
5. **NEW: Lesson length, buffer & bank-holiday** — currently stranded in `AvailabilityPage`, not reachable here

## Changes

### 1. Wire each editor into `SettingsDirtyContext`
For `WorkingHoursEditor`, `PupilBookingSettingsEditor`, and `ReminderSettings`:
- Load row → keep `original` + `draft` in state.
- `dirty = JSON.stringify(draft) !== JSON.stringify(original)` → call `setDirty(key, dirty)`.
- `register(key, { save, reset })` in an effect; cleanup on unmount.
- Remove the per-card "Save" button from each component (sticky bar handles it).
- Keep destructive/instant actions (Disconnect, Sync Now, delete override, day-off quick add) as immediate actions — only field edits flow through the save bar.

Keys: `working-hours`, `pupil-booking`, `reminders`.

### 2. Add a 5th section: Lesson length, buffer & bank holidays
- Extract the "Lesson length & buffer" block from `AvailabilityPage` into a new `LessonLengthBufferEditor` component (same UI, same save logic, wired to `SettingsDirtyContext` with key `lesson-length`).
- Add it to `categories.tsx > schedule.sections` after `reminders`.
- `AvailabilityPage` can keep using the same component so the legacy route still works.

### 3. Fix the "Rendered more hooks than during the previous render" error
Likely cause: one of the editors early-returns (`if (loading) return …`) before later `useEffect`/`register` calls run. Audit each editor and make sure every hook (including the `register`/`setDirty` effects added in step 1) runs unconditionally before any conditional return.

### 4. Quality fixes while in there
- `WorkingHoursEditor`: replace the 7-sequential-await weekly save with a single `upsert` array; normalise times to `HH:mm:ss`.
- `PupilBookingSettingsEditor`: hide the unused `allowed_durations` field (already covered by `instructors.allowed_lesson_lengths`).
- `ReminderSettings`: extend the reminder-time options to include 06:00, 07:00, 08:00, 09:00 plus existing 10:00–20:00.

## Out of scope
- Mobile layout changes (per project rule).
- Google Calendar sync internals.
- Other settings pages (Credentials, Pricing, etc.).
- Whether reminder/cron jobs actually fire (separate edge-function audit).

## Technical notes
- Keys must be unique strings; use a stable `register`/cleanup pattern as in `AvailabilityPage` (lines 41–57) to avoid stale closures.
- `SettingsDirtyContext.saveAll` iterates dirty keys serially — safe for these 4 sections.
- No DB migration required; all columns already exist.
