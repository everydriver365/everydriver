

## Comprehensive Admin Instructor Profile Page

### Current State
The `AdminInstructorProfile.tsx` page has these sections:
- Header (avatar, status, plan, quick stats)
- Action bar (change plan, reassign pupils, view website, activate/deactivate, delete)
- Contact & Location
- Rates & Booking
- Vehicle
- ADI & Compliance
- Bio & Skills
- Social & Web
- Commission & School
- Linked Pupils

### Missing — To Add

**1. Payment & QR Codes Section**
New `SectionPanel` with inline-editable fields for:
- `payment_qr_url` (legacy QR)
- `payment_qr_url_pupil_pays` (pupil pays QR)
- `payment_qr_url_instructor_pays` (instructor pays QR)
- `commission_payer` (dropdown: pupil / instructor)
- `payment_link_base_url` (payment link URL)
- QR image previews alongside each URL field
- Upload capability for QR images (reuse existing upload pattern)

**2. Payment Gateway Toggles**
Inline toggles/fields for:
- `klarna_enabled`
- `clearpay_enabled`
- `stripe_account_id`
- `truelayer_enabled`

**3. Vehicle Compliance Dates** (extend existing Vehicle section)
- `car_insurance_expiry`
- `car_mot_expiry`
- `car_tax_expiry`
- `car_image_url` (with upload)

**4. Google Calendar Integration**
- `google_calendar_id` (read-only display)
- `last_calendar_sync` (read-only timestamp)
- Connection status indicator

**5. Working Hours** (embed existing `WorkingHoursEditor`)
- Embed the existing component in a collapsible `SectionPanel`

**6. Feature Toggles Section**
Boolean flags the admin can toggle:
- `pupil_self_booking_enabled`
- `pupil_app_enabled`
- `intake_questions_enabled`
- `pricing_rules_enabled`
- `lesson_feedback_enabled`
- `ai_receptionist_enabled`
- `broadcast_messaging_enabled`
- `reflective_logs_enabled`
- `cancellation_analytics_enabled`
- `availability_paused`

**7. Branding & Website Section** (extend Social & Web)
- `brand_colour`, `secondary_colour`
- `website_theme`, `website_font`
- `logo_url`, `hero_image_url`
- `custom_domain`, `custom_domain_verified`
- Embed `AdminWebsiteManager` for mini-website pages

**8. Additional Compliance Fields** (extend ADI section)
- `adi_certificate_url` (link/upload)
- `adi_code_of_practice` (toggle)
- `cpd_certified`, `cpd_hours_logged`, `cpd_year_target`

### Implementation Approach

**File: `src/components/admin/AdminInstructorProfile.tsx`**

1. Expand `InstructorData` interface to include all missing fields from the `instructors` table schema
2. The `fetchInstructor` already does `select("*")` so all fields are already fetched — just need to type them
3. Add new `SectionPanel` blocks in the grid for each group above
4. For boolean toggles, add a simple `Switch` component inline (similar pattern to `InlineEditField` but for booleans)
5. For QR image uploads, reuse the existing `handleProfileImageUpload` pattern with the `instructor-images` bucket
6. Import and embed `WorkingHoursEditor` and `AdminWebsiteManager` in collapsible sections
7. For `commission_payer`, use a `Select` dropdown instead of text input

This is a single-file change (expanding `AdminInstructorProfile.tsx`) with imports of existing components. No database migrations needed — all fields already exist.

