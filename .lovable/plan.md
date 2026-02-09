

# Security Issues and Remediation Plan

## Summary

The scan found **83 linter issues** across 3 categories. Here's a breakdown of what needs fixing, ordered by priority.

---

## 1. CRITICAL: Overly Permissive RLS Policies (50+ tables)

Many tables have INSERT, UPDATE, and DELETE policies set to `USING(true)` or `WITH CHECK(true)`, meaning **any user (or even anonymous visitors)** can modify data.

**Affected tables include:**
- `admin_section_notes` -- public can insert/update/delete
- `booking_upsells` -- public full access
- `calendar_events` -- public can insert/delete
- `calendar_sync_queue` -- public full access
- `conversations` -- public full access
- `course_enquiries` -- public can manage (some public insert is intentional, but ALL operations is not)
- `course_reviews` -- public full access
- `course_templates` -- public full access
- `gps_devices` -- public full access
- `homepage_features/hero/sections/stats/testimonials` -- public full access
- `included_features` -- public full access
- `instructor_app_features/hero` -- public full access
- `instructor_expenses` -- any authenticated user can insert/update/delete any expense
- `admin_todos` -- any authenticated user can manage
- `admin_websites_needed` -- any authenticated user can manage
- And many more...

**Risk:** Anyone can delete or modify instructor data, lesson records, payment history, homepage content, and more -- without being logged in.

**Fix:** Replace `USING(true)` / `WITH CHECK(true)` policies with proper checks:
- Admin tables: `public.has_role(auth.uid(), 'admin')`
- Instructor-owned tables: `instructor_id = public.get_instructor_id_for_user(auth.uid())`
- Public insert only (enquiries/bookings): Keep `WITH CHECK(true)` for INSERT only, restrict UPDATE/DELETE

---

## 2. HIGH: Tables with RLS Enabled but No Policies

These tables have RLS turned on but zero policies, meaning **nobody can access them** (or they're bypassed by service role):

- `admin_activity_log`
- `admin_campaigns`

**Fix:** Add appropriate policies (admin-only access for both).

---

## 3. MEDIUM: Leaked Password Protection Disabled

The authentication system doesn't check new passwords against known leaked/breached password databases.

**Fix:** Enable leaked password protection in the authentication settings.

---

## 4. MEDIUM: Instructor Personal Data Publicly Exposed

The `instructors` table has a SELECT policy of `USING(true)`, exposing sensitive fields like:
- Email addresses, phone numbers, home addresses
- Financial data (hourly_rate, school_skim_percentage)
- Google OAuth tokens (google_access_token, google_refresh_token)

**Fix:** Create a `public_instructors` view that only exposes safe fields (name, bio, profile image, app_slug), and restrict the full table to the instructor themselves and admins.

---

## 5. LOW: Edge Function Input Validation

Public-facing backend functions (create-booking, create-enquiry) lack server-side input validation.

**Fix:** Add Zod schema validation to these functions.

---

## Implementation Approach

Due to the large number of affected tables, this will be done in batches:

### Batch 1 - Admin tables
Fix policies on admin_section_notes, admin_todos, admin_websites_needed, admin_activity_log, admin_campaigns, homepage_*, course_templates, included_features, instructor_app_* to require admin role.

### Batch 2 - Instructor-owned tables
Fix policies on calendar_events, instructor_expenses, conversations, and other instructor-scoped tables to verify ownership via `get_instructor_id_for_user(auth.uid())`.

### Batch 3 - Public data exposure
Create a `public_instructors` view excluding sensitive columns. Update public-facing queries to use the view.

### Batch 4 - Auth hardening
Enable leaked password protection.

### Batch 5 - Edge function validation
Add input validation to create-booking and create-enquiry functions.

---

## Technical Details

Each RLS policy fix follows this pattern:

```text
-- Example: Admin-only table
DROP POLICY "Anyone can manage homepage features" ON homepage_features;
CREATE POLICY "Admins can manage homepage features"
  ON homepage_features FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Example: Instructor-owned table
DROP POLICY "Instructors can delete their own events" ON calendar_events;
CREATE POLICY "Instructors manage own events"
  ON calendar_events FOR ALL
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));
```

This is a significant amount of work due to the 50+ affected tables. Would you like me to proceed with all batches, or start with the most critical ones first?

