
# Security Remediation Plan — COMPLETED

## Results Summary

Started with **83 linter issues**, reduced to **9** (all acceptable).

### ✅ Batch 1 — Admin Tables (DONE)
Fixed 25 admin/CMS tables: `admin_section_notes`, `admin_todos`, `admin_websites_needed`, `admin_activity_log`, `admin_campaigns`, `homepage_*`, `course_templates`, `included_features`, `instructor_app_*`, `booking_upsells`, `course_reviews`, `course_enquiries`, `site_images`, `site_settings`, `test_centres`, `instructor_test_centres`, `instructor_courses`, `instructor_homepage_content`.

All now require `public.has_role(auth.uid(), 'admin')`.

### ✅ Batch 2 — Instructor-Owned Tables (DONE)
Fixed 35+ tables: `calendar_events`, `calendar_sync_queue`, `conversations`, `instructor_expenses`, `gps_devices`, `instructor_calendar_events`, `instructor_date_overrides`, `instructor_working_hours`, `instructor_vehicles`, `messages`, `live_pupil_positions`, `live_chat_*`, `payment_intents`, `payment_link_tracking`, `pupil_referrals`, `pupil_upsells`, `pupil_achievements`, `pupil_coaching_messages`, `parent_otp_codes`, `pupil_otp_codes`, `pupil_push_subscriptions`, `instructor_notifications`, `lesson_waitlist`, `slot_offers`, `pre_lesson_checklist_completions`, `pupil_leaderboard`, `pupil_rewards_history`, `platform_commissions`, `telematics_*`, `gap_offers`, `vehicle_security_alerts`.

All now use `instructor_id = public.get_instructor_id_for_user(auth.uid())` or admin role checks.

### ✅ Batch 3 — Public Data Exposure (DONE)
- Created `public_instructors` view excluding sensitive fields (email, phone, address, financial data, OAuth tokens)
- Restricted full `instructors` table SELECT to owner + admin
- Anon users can only see active instructors via the view

### ⚠️ Batch 4 — Leaked Password Protection
Leaked password protection is a platform-level setting. This cannot be changed via migrations.

### ✅ Batch 5 — Edge Function Validation (DONE)
Added Zod schema validation to:
- `create-enquiry`: validates name, address, postcode, courseType, requestedHours, preferredTiming, additionalNotes
- `create-booking`: validates instructorId (UUID), pupilName, pupilEmail, pupilPhone, pupilAddress, pupilPostcode, courseType, courseHours, totalPrice, slots (date/time format), paymentType, upsells

---

## Remaining 9 Linter Warnings (Acceptable)

8 × `WITH CHECK(true)` on INSERT — these are intentional for public-facing forms:
1. `course_enquiries` — public enquiry submission
2. `live_chat_messages` — public chat
3. `live_chat_sessions` — public chat sessions
4. `live_chat_typing` — typing indicators
5. `pre_lesson_checklist_completions` — pupil checklist
6. `reflective_logs` — pupil reflective logs
7. `payment_link_tracking` — payment link creation
8. `lesson_cancellation_requests` — pupil cancellation

1 × Leaked password protection disabled (platform setting)
