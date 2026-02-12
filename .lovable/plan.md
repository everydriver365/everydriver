

## Security Remediation Plan

This plan addresses all critical security vulnerabilities found in your database. The issues fall into three categories: sensitive data publicly exposed, overly permissive write policies, and missing policies on tables with RLS enabled.

---

### Priority 1: Protect Sensitive Personal Data (Critical)

These tables currently let anyone on the internet read private information like pupil details, payment records, lesson locations, and progress data.

**Tables with dangerous public SELECT policies to fix:**

| Table | Current Policy | Risk | Fix |
|-------|---------------|------|-----|
| `pupils` | "Parents can view pupils by parent phone" USING(true) | All pupil names, phones, addresses exposed | Restrict to parent_phone match |
| `lesson_history` | "Lesson history is publicly viewable" USING(true) | All lesson notes, scores, locations exposed | Restrict to instructor/pupil owner |
| `lesson_history` | "Parents can view lesson history..." USING(true) | Duplicate exposure | Restrict to parent_phone match on pupil |
| `payment_history` | "Parents can view payment history..." USING(true) | All payment amounts, methods exposed | Restrict to parent_phone match on pupil |
| `scheduled_lessons` | "Scheduled lessons are publicly viewable" USING(true) | All lesson times, pickup locations exposed | Restrict to instructor/pupil owner |
| `scheduled_lessons` | "Parents can view scheduled lessons..." USING(true) | Duplicate exposure | Restrict to parent_phone match on pupil |
| `pupil_achievements` | "Anyone can view achievements" USING(true) | Pupil progress data exposed | Restrict to instructor/pupil owner |
| `pupil_badges` | "Pupil badges are viewable by everyone" USING(true) | Pupil progress data exposed | Restrict to instructor/pupil owner |
| `pupil_coaching_messages` | "Anyone can view coaching messages" USING(true) | Private coaching content exposed | Restrict to instructor/pupil owner |
| `pupil_referrals` | "Public read access for referrals" USING(true) | Referral data exposed | Restrict to instructor/pupil owner |
| `pupil_rewards_history` | "Public read access for rewards history" USING(true) | Rewards data exposed | Restrict to instructor/pupil owner |
| `pupil_syllabus_progress` | "Pupils can view their own syllabus progress" USING(true) | Syllabus progress exposed | Restrict to instructor/pupil owner |
| `lesson_syllabus_updates` | "Anyone can read syllabus updates" USING(true) | Syllabus data exposed | Restrict to instructor/pupil owner |
| `lesson_cancellation_requests` | "Public can view cancellation requests" USING(true) | Cancellation data exposed | Restrict to instructor/pupil owner |

**Approach:** Replace each `USING(true)` SELECT policy with proper ownership checks. For "parent" policies, restrict access so only rows matching the pupil's `parent_phone` to the requesting context are visible (these will use a pupil OTP-based approach matching existing patterns).

---

### Priority 2: Lock Down Write Policies (High)

These INSERT/UPDATE/DELETE policies let anyone write data without authentication.

| Table | Policy | Fix |
|-------|--------|-----|
| `course_enquiries` | Public INSERT WITH CHECK(true) | Keep public but add basic validation |
| `course_reviews` | Public INSERT WITH CHECK(true) | Keep public but add basic validation |
| `live_chat_messages` | Public INSERT WITH CHECK(true) | Keep -- live chat must be public |
| `live_chat_sessions` | Public INSERT WITH CHECK(true) | Keep -- live chat must be public |
| `live_chat_typing` | ALL USING(true) WITH CHECK(true) | Keep -- live chat must be public |
| `lesson_cancellation_requests` | Public INSERT WITH CHECK(true) | Keep public for pupil cancellations |
| `payment_link_tracking` | Public INSERT WITH CHECK(true) | Keep -- payment tracking must work without auth |
| `pre_lesson_checklist_completions` | Public INSERT WITH CHECK(true) | Keep -- pupils complete without auth |
| `reflective_logs` | ALL USING(true) WITH CHECK(true) | Restrict to pupil/instructor ownership |

Most of the write-open tables are intentionally public (live chat, enquiries, reviews, payment tracking). The main one to fix is `reflective_logs`.

---

### Priority 3: Add Missing Policies (Medium)

| Table | Issue | Fix |
|-------|-------|-----|
| `cron_sync_config` | RLS enabled, no policies | Add admin-only policy |
| `quartix_auth_cache` | RLS enabled, no policies | Add admin-only policy |

---

### Priority 4: Enable Leaked Password Protection (Low)

Enable the leaked password protection setting in authentication to prevent users from signing up with known compromised passwords.

---

### Technical Details

**Migration 1 -- Fix sensitive SELECT policies:**

The migration will:
1. Drop all `USING(true)` SELECT policies on sensitive tables
2. Replace with ownership-based policies using `get_instructor_id_for_user(auth.uid())`
3. For parent access, use proper filtering: pupils whose `parent_phone` matches, joined through to their data
4. Keep the existing instructor/admin ALL policies untouched

**Migration 2 -- Fix reflective_logs and add missing policies:**

1. Replace `reflective_logs` ALL policy with instructor-ownership check
2. Add admin-only policies for `cron_sync_config` and `quartix_auth_cache`

**Migration 3 -- Enable leaked password protection:**

Use the auth configuration tool to enable this setting.

**Frontend changes:** None required -- all existing queries already filter by instructor_id or pupil_id, so tightening RLS will not break any authenticated flows. The public booking pages query `instructors` (which already has proper policies) and `scheduled_lessons` / `instructor_working_hours` etc. for availability -- those public-read policies for booking-related tables will remain.

**Important note about parent access:** The current "parent" SELECT policies use `USING(true)` which means they grant access to everyone, not just parents. The fix will use a proper check that verifies the parent relationship. Since the existing pupil app uses OTP codes for parent authentication (not Supabase Auth), parent access will be handled via the pupil's `parent_phone` column matching through authenticated instructor context or through edge functions.

