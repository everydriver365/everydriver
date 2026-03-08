

## Security Assessment: Pupil Data Protection

### Current Status: Several Critical Issues Found

A security scan reveals **26 findings** including **9 critical/error-level** vulnerabilities affecting pupil and lesson data. Here is the honest picture:

---

### What IS Secure
- **Authentication**: Instructor auth uses proper Supabase Auth with JWT tokens; pupil auth uses server-side password hashing (PBKDF2) in an edge function
- **Role-based access**: Admin role checks use a `SECURITY DEFINER` function (`has_role`) to prevent RLS recursion
- **Audit trail**: Soft-delete pattern and `data_audit_log` table track all changes
- **Multi-tenant isolation**: Most queries filter by `instructor_id`

### What is NOT Secure (Needs Fixing)

**Critical - Data Exposed to Anonymous Users:**

1. **Scheduled lessons** - All 56 lessons (including pupil addresses, postcodes, payment amounts, notes) readable by anyone
2. **Pupil notes** - Anonymous users can read, write, update, and delete all pupil notes
3. **GPS lesson routes** - Real GPS coordinates (lat/lng, road names) publicly readable
4. **Learner test requests** - Names, emails, phones, postcodes exposed
5. **Theory mock results** - Anyone can read all scores and insert fake results
6. **Pupil terms agreements** - IP addresses, signed dates exposed without token validation
7. **Live chat sessions/messages** - Visitor emails and phone numbers publicly readable
8. **SOS alerts** - Any instructor can read ALL other instructors' emergency locations

**Warnings:**
9. Signing tokens publicly readable
10. Calendar share tokens exposed
11. Geotab session cache accessible to any authenticated user
12. Instructor booking settings publicly readable with broken write policies
13. Leaked password protection is disabled
14. 11 tables have overly permissive `USING(true)` or `WITH CHECK(true)` on INSERT/UPDATE/DELETE

### Recommended Fix Plan

**Phase 1 - Critical PII fixes** (scheduled_lessons, notes, lesson_routes, learner_test_requests, theory_mock_results, pupil_terms_agreements):
- Replace all `USING(true)` anon/public SELECT policies with instructor-ownership checks (`instructor_id = get_instructor_id_for_user(auth.uid())`)
- For pupil-facing tables, scope access to the authenticated pupil's own records
- Remove all anon INSERT/UPDATE/DELETE policies on notes

**Phase 2 - Sensitive data fixes** (live_chat, SOS alerts, signing tokens, calendar shares):
- Restrict live chat to admin role only
- Remove cross-instructor SOS visibility
- Add token-based filtering to signing and calendar share policies

**Phase 3 - Hardening**:
- Enable leaked password protection
- Lock down Geotab session cache to service_role
- Fix broken booking settings write policy
- Move `password_hash` from `pupils` table to a separate `pupil_credentials` table (as noted in your security memory but not yet implemented)

This is a significant remediation effort touching ~12 tables with ~20 policy changes. Shall I proceed with implementing these fixes?

