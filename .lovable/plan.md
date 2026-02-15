

## Comprehensive Quick Settings Panel

Add a "Quick Settings" item under the cog menu in the instructor mobile header that opens a bottom sheet with **all** toggleable settings grouped into logical sections.

### All Toggle Items

**Visibility and Status**
- **Online Visibility** (`is_active`) -- Show/hide profile on course finder and mini website
- **Online Status** (`is_online`) -- Show as online for live chat
- **Availability Paused** (new `availability_paused` column) -- Instantly block all pupil bookings

**Pupil App**
- **Pupil App Enabled** (`pupil_app_enabled`) -- Toggle pupil-facing portal on/off
- **Pupil App Dark Mode** (`pupil_app_dark_mode`) -- Dark mode for pupil portal

**Payments (Buy Now Pay Later)**
- **Klarna** (`klarna_enabled`) -- Toggle Klarna Pay in 3
- **Clearpay** (`clearpay_enabled`) -- Toggle Clearpay Pay in 4
- **Deposit Required** (`deposit_enabled`) -- Toggle deposit on bookings
- **TrueLayer** (`truelayer_enabled`) -- Toggle open banking payments

**Notifications** (from `instructor_reminder_preferences` table)
- **SMS Reminders** (`sms_enabled`) -- Toggle SMS lesson reminders
- **Email Reminders** (`email_enabled`) -- Toggle email reminders
- **Push Notifications** (`push_enabled`) -- Toggle push notifications
- **1-Hour Reminder** (`reminder_1h_enabled`) -- Toggle 1-hour-before reminder

**Website**
- **Custom Branding** (`custom_branding_enabled`) -- Toggle custom branding on mini website
- **Show Logo on Hero** (`hero_show_logo`) -- Toggle logo display on website hero

**Appearance**
- **Dark Mode** -- Toggle app dark mode (local ThemeContext, not database)

### How It Works

1. User taps the cog icon in the mobile header
2. A "Quick Settings" menu item appears with a SlidersHorizontal icon
3. Tapping it opens a bottom sheet (using the existing Sheet component)
4. Settings are displayed in grouped sections with labelled Switch toggles
5. Each toggle immediately updates the database (or local context for theme) and shows a toast
6. The "Availability Paused" toggle additionally blocks the pupil self-booking calendar

### Technical Details

**Database Migration:**
- Add `availability_paused` boolean column (default `false`) to `instructors` table

**New File:**
- `src/components/instructor/QuickSettingsSheet.tsx` -- Sheet component with grouped toggle rows. Reads instructor booleans from the auth context + fetches notification prefs from `instructor_reminder_preferences`. Each toggle performs an individual database UPDATE and calls `refreshInstructor()`.

**Modified Files:**

1. `src/components/layout/InstructorPortalLayout.tsx`
   - Add `showQuickSettings` state
   - Add "Quick Settings" DropdownMenuItem with SlidersHorizontal icon in the cog dropdown
   - Render `QuickSettingsSheet` component

2. `src/context/InstructorAuthContext.tsx`
   - Add `availability_paused`, `pupil_app_enabled`, `pupil_app_dark_mode`, `deposit_enabled`, `truelayer_enabled`, `custom_branding_enabled`, `hero_show_logo`, `is_online`, `dark_mode_enabled` to the `InstructorProfile` interface and select query

3. `src/components/pupil-portal/SelfBookingCalendar.tsx`
   - Check `availability_paused` flag on the instructor; if true, show an "Instructor is not currently accepting bookings" message and disable slot selection

