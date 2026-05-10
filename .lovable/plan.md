## Plan: Working hours page — confirm sticky-bar wiring + light cleanup

### Audit result

The four field-based editors on `/instructor/settings/working-hours` are already wired to `SettingsDirtyContext` and the sticky "Save all changes" bar:

| Section | Component | Dirty key |
|---|---|---|
| Working hours grid | `WorkingHoursEditor` | `working-hours` |
| Lesson length, buffer & bank holidays | `LessonLengthBufferEditor` | `lesson-length` |
| Pupil self-service booking | `PupilBookingSettingsEditor` | `pupil-booking` |
| Lesson reminders | `ReminderSettings` | `reminders` |

Each registers `{ save, reset }` and reports dirty when its draft diverges from the loaded original. **Google Calendar sync** has no form fields (Connect / Sync now / Disconnect actions only), so it correctly stays outside the bar.

**Date overrides** and **Quick day off** stay as instant writes — they're list operations, not field edits.

### Cleanup pass (this is the only code change)

1. **`WorkingHoursEditor.tsx`**
   - Drop the `"Preset applied — remember to save!"` toast wording; replace with `"Preset applied"` since the sticky bar is now the source of truth.
2. **`ReminderSettings.tsx`**
   - Remove unused `Save` import from `lucide-react`.
3. **`PupilBookingSettingsEditor.tsx`**
   - Remove unused `Save` import from `lucide-react`.
   - Remove any orphaned `saveMutation` declaration if still present after the previous refactor.
4. **`LessonLengthBufferEditor.tsx`** — already clean, no change.

### Verification

- Load `/instructor/settings/working-hours`, edit one field in each of the four sections, confirm:
  - Sticky bar appears the moment any field changes.
  - "Save all changes" persists every section in one go and the bar disappears.
  - "Discard" reverts each editor to its loaded values.
- Add then remove a date override → still instant, no bar interaction.
- Apply a weekly preset → sticky bar appears (preset mutates the same draft state).

### Out of scope

- Mobile layouts.
- Other settings pages.
- Date-override / quick-day-off behaviour (kept instant per your decision).
- Google Calendar connect flow.