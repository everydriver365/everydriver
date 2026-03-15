

## Implementation Plan: 8 Features (All Except Stripe Connect)

This is a large build covering 8 features. Here's a concise plan organized by implementation order.

---

### Feature 1: Waiting List & Capacity Management UI
**What exists:** `lesson_waitlist` table, `process-cancellation-waitlist` edge function, `WaitlistManager` component, `WaitlistDialog` — all already built.
**What's needed:** A public-facing waitlist join form when instructor is fully booked, and an auto-notification flow when cancellations create openings.

**Work:**
- Add a `waitlist_entries` table (name, phone, email, preferred_days, preferred_times, instructor_id, status, created_at) via migration
- RLS: anon INSERT (for public form), instructor SELECT/UPDATE/DELETE
- Add a "Join Waiting List" card on the mini-website when `availability_paused = true` or no slots available
- Edge function enhancement: when `process-cancellation-waitlist` finds matches, send SMS notifications to matched waitlist pupils
- Add waitlist count badge to instructor dashboard

---

### Feature 2: Franchise / Multi-Instructor School Portal
**What exists:** Marketing pages reference "multi-instructor management" but no actual implementation.

**Work:**
- DB migration: `schools` table (id, name, owner_user_id, logo_url, brand_colour, created_at), `school_instructors` join table (school_id, instructor_id, role enum school_owner/school_admin/instructor, joined_at)
- RLS: school owners can manage their school's instructors
- New pages: `/school/dashboard`, `/school/instructors`, `/school/reports`
- School dashboard: aggregate stats across all instructors (total lessons, earnings, pass rates, pupil counts)
- Instructor comparison table with performance metrics
- School owner auth: reuse existing Supabase Auth, resolve school via `schools.owner_user_id = auth.uid()`
- Add school invite flow: generate invite link, instructor accepts to join school

---

### Feature 3: Bulk Operations Panel
**What exists:** `BulkSMSDialog` component, `send-campaign` edge function.

**Work:**
- New page: `/instructor/bulk-operations` with 3 tabs: Bulk SMS, Bulk Reschedule, Bulk Price Update
- **Bulk SMS tab**: Enhance existing `BulkSMSDialog` into a full-page experience with audience filters (all pupils, active only, test-date pupils, overdue balance)
- **Bulk Reschedule tab**: Select a date range → show all lessons → select/deselect → pick new dates/times → batch update `lessons` table. Use case: bank holidays
- **Bulk Price Update tab**: Select pupils (all, filtered) → set new lesson price → batch update `pupils.lesson_price`
- Add tile to instructor dashboard/More menu

---

### Feature 4: Smart Reporting & PDF Export Hub
**What exists:** `generate-pdf` edge function (earnings, progress, mileage, tax reports), `WeeklyReportCard` component, `generate-weekly-report` edge function.

**Work:**
- New page: `/instructor/reports` — Reports Hub with cards for each report type
- Report types: Weekly Business Summary, Monthly Earnings, Tax Year Summary (HMRC format), Pupil Progress (for parents), Mileage Log
- Each card shows preview stats + "Generate PDF" button that calls `generate-pdf` edge function
- Date range picker for filtering
- Download history list (store in `instructor_reports` table: id, instructor_id, report_type, filename, generated_at, pdf_url)
- Upload generated PDFs to `instructor-resources` storage bucket for re-download
- Add tile to instructor dashboard

---

### Feature 5: Instructor Availability Rules Engine
**What exists:** `instructor_working_hours`, `instructor_date_overrides` tables, `AvailabilityCalendar` and `InstructorQuickAvailability` components.

**Work:**
- DB migration: `availability_rules` table (id, instructor_id, rule_type enum recurring_exception/holiday_block/seasonal, description, day_of_week, week_of_month, start_date, end_date, is_available, auto_notify_pupils, created_at)
- New component: `AvailabilityRulesManager` in scheduling settings
- Rule types:
  - Recurring exceptions: "No lessons on first Monday of each month"
  - Holiday blocks: date range picker → marks all days unavailable, optionally auto-SMS affected pupils
  - Seasonal hours: different working hours for summer/winter
- When rules are saved, auto-generate `instructor_date_overrides` rows for the next 90 days
- Edge function `apply-availability-rules`: cron job to refresh overrides monthly
- "Holiday Mode" toggle: one-click to block out a date range and notify all pupils with lessons in that period

---

### Feature 6: Pupil Milestone Certificates
**What exists:** `PupilMilestoneFeed` component, `pupil_milestones` table (cast as `any`), `generate-pdf` edge function with jsPDF.

**Work:**
- DB migration: `pupil_certificates` table (id, pupil_id, instructor_id, milestone_type, certificate_url, issued_at)
- Milestone types: first_lesson, 10_lessons, 20_lessons, test_pass, theory_pass
- New component: `CertificateGenerator` using jsPDF — branded PDF with instructor logo, pupil name, date, achievement, decorative border
- Auto-detect milestones: trigger on lesson completion count or test result insert
- Edge function `generate-certificate`: creates PDF, uploads to storage, records in `pupil_certificates`
- Display certificates in pupil portal with download button
- Instructor can manually issue certificates from pupil detail screen

---

### Feature 7: Parent Portal Enhancements
**What exists:** Full parent portal with OTP auth, tabs for overview/lessons/payments/messages/safety, `ParentPaymentHistory`, `ParentUpcomingLessons`, `ParentSyllabusOverview`, `ParentSafetyScores`, `ParentChat`, `ParentPaymentTopUp`.

**Work:**
- **Attendance report**: New `ParentAttendanceReport` component showing lesson attendance rate, cancellation history, punctuality
- **DVSA Progress Dashboard**: Enhanced `ParentSyllabusOverview` with visual progress bars per category, competency level colours, and "test readiness" score
- **Lesson notes viewer**: Show instructor's post-lesson notes/comments to parents (read-only from `lesson_feedback` or `instructor_notes`)
- **Export progress PDF**: Button to generate and download pupil progress report PDF (calls `generate-pdf` with `progress` type)
- Add these as new sub-tabs or sections within existing parent portal tabs

---

### Feature 8: Marketing Landing Page Builder
**What exists:** Full mini-website system with 5 page types (home, about, services, reviews, contact), `instructor_website_pages` table with `content_blocks` JSONB, `PageContentRenderer` component.

**Work:**
- New component: `WebsitePageEditor` — visual block editor for `content_blocks` JSONB
- Block types: Text, Features List, Image Gallery, Testimonial Carousel, CTA Button, Video Embed, FAQ Accordion, Pricing Table, Stats Counter
- Drag-and-drop reordering of blocks (using existing patterns)
- Live preview pane showing how blocks render
- SEO settings panel: meta_title, meta_description, og_image per page
- Custom sections: instructor can add/remove pages beyond the default 5
- Integration with existing `InstructorMiniWebsiteSettings` page as a new "Page Editor" tab

---

### Build Order
1. Bulk Operations Panel (quick win — UI for existing backend)
2. Smart Reporting Hub (extends existing PDF edge function)
3. Availability Rules Engine (extends existing tables)
4. Pupil Milestone Certificates (new table + PDF generation)
5. Parent Portal Enhancements (extends existing portal)
6. Waiting List Capacity UI (extends existing edge function)
7. Marketing Landing Page Builder (largest UI effort)
8. Franchise/School Portal (largest feature — new auth flow + dashboard)

### Database Migrations Summary
- `waitlist_entries` table + RLS
- `schools` + `school_instructors` tables + RLS
- `availability_rules` table + RLS
- `pupil_certificates` table + RLS
- `instructor_reports` table + RLS

