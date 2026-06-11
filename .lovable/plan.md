### Where the setting lives today
The "Reserve start date only" toggle (plus its `max hours per week` input) is currently buried inside **Settings → Pupil Self-Service Booking** (`PupilBookingSettingsEditor`). It writes to `instructor_booking_settings.allow_start_date_only_booking` and `start_date_only_max_hours_per_week`.

### Goal
Surface it as its own top-level link in the instructor settings menu, positioned **directly under "Working Hours"** in the Scheduling category.

### Changes
1. **New component** `src/components/instructor/StartDateOnlyBookingEditor.tsx`
   - Reads/writes only `allow_start_date_only_booking` and `start_date_only_max_hours_per_week` on `instructor_booking_settings` (upsert on `instructor_id`).
   - Same UI pattern as the existing section (toggle + conditional max-hours input).
   - Hooks into `useOptionalSettingsDirty` so the sticky save bar works.

2. **`src/pages/InstructorMenu.tsx`**
   - Add new item just after `working-hours` (line 158):
     ```
     { id: "first-lesson-only", title: "Book First Lesson Only", description: "Let pupils reserve a start date and arrange times later", icon: CalendarDays, tintBg: "#EDE9FE", tintColor: "#5B21B6", category: "scheduling" }
     ```
   - Add `case "first-lesson-only": return <StartDateOnlyBookingEditor instructorId={instructorId} />;` in the renderer switch.

3. **`src/components/instructor/settings/categories.tsx`**
   - Add the same entry under the scheduling category right after `hours` (Working hours), pointing to the new component, so the desktop settings shell also lists it.

### Out of scope
- Leave the existing toggle inside `PupilBookingSettingsEditor` untouched so nothing breaks; both surfaces write to the same row.
- No DB or mobile-layout changes.