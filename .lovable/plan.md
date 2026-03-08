

## Cleanup Plan: Security, RLS, and Data Protection Hardening

The security scan found **28 issues** across 3 categories. Here is a prioritized remediation plan.

---

### Priority 1 (CRITICAL) --- Fix Dangerous RLS Policies

These tables expose sensitive data to **anyone on the internet** without authentication:

| Table | Problem | Fix |
|-------|---------|-----|
| `instructors` | Anon SELECT exposes emails, phones, home addresses, OAuth tokens | Remove anon SELECT policy; route public lookups through existing `public_instructors` view |
| `scheduled_lessons` | Anon SELECT exposes pickup addresses, pupil IDs, payment info | Restrict anon SELECT to only `lesson_date`, `start_time`, `duration_minutes`, `instructor_id` |
| `reflective_logs` | Public ALL (read+write) for everyone | Replace with authenticated pupil-only policy |
| `notes` | 4 anon policies give full CRUD on pupil notes | Remove anon policies; require authenticated instructor/pupil ownership |
| `lesson_feedback` | UPDATE uses tautology `pupil_id = pupil_id` (always true) | Fix to validate against authenticated pupil identity |
| `quotes` | Anon SELECT exposes all quotes (name, email, phone) despite "by token" name | Add actual token filter to USING clause |
| `pupil_subscriptions` | Anon SELECT exposes pickup addresses | Remove anon SELECT; restrict to instructor + pupil owners |
| `pupils` (password_hash) | Instructors can SELECT password_hash column | Move password_hash to separate `pupil_credentials` table with service-role-only access |
| `instructor_health_logs` + blood pressure/glucose/water logs | Publicly readable medical data | Restrict to owning instructor only |

---

### Priority 2 (HIGH) --- Fix Permissive Write Policies

These tables have `WITH CHECK (true)` on INSERT, allowing **anyone** to insert arbitrary data:

| Table | Current Policy | Fix |
|-------|---------------|-----|
| `live_chat_messages` | Anyone can INSERT | Keep public INSERT but add session_id validation |
| `live_chat_sessions` | Anyone can INSERT | Acceptable for visitor chat --- add rate limiting instead |
| `lesson_feedback` | Public can INSERT | Restrict to authenticated instructors |
| `lesson_reminders_log` | Public can INSERT (named "Service role") | Restrict to service_role only |
| `payment_reminder_log` | Public can INSERT (named "Service can insert") | Restrict to service_role only |
| `pre_lesson_checklist_completions` | Public can INSERT | Restrict to authenticated pupils |
| `live_chat_typing` | Public ALL | Keep for realtime typing, acceptable |

---

### Priority 3 (HIGH) --- Additional Security Fixes

1. **Enable leaked password protection** --- currently disabled in auth settings
2. **Move pupil password_hash** to a separate `pupil_credentials` table accessible only via service role, preventing instructor-side hash extraction
3. **Restrict Google Places API key endpoint** (`get-google-maps-key`) --- add JWT auth check so only authenticated users can retrieve it
4. **Add `geotab_session_cache` RLS policy** --- RLS is enabled but no policies exist (table is inaccessible)

---

### Priority 4 (MEDIUM) --- Data Exposure Reduction

| Table | Problem | Fix |
|-------|---------|-----|
| `live_chat_sessions` | Public SELECT exposes visitor name/email/phone | Restrict to instructor + admin |
| `live_chat_messages` | Public SELECT exposes all messages | Restrict to session participants |
| `platform_commissions` | Public SELECT exposes all instructor financials | Restrict to owning instructor + admin |
| `instructor_calendar_events` | Public SELECT exposes personal calendar titles | Restrict to owning instructor |
| `lesson_syllabus_updates` | Anon SELECT exposes all pupil progress | Remove anon policy; keep authenticated policies |

---

### Priority 5 (LOW) --- Console Warnings

- `RunningLateSheet` passes a ref to a function component without `forwardRef` --- cosmetic React warning, no user impact

---

### Summary

| Priority | Issues | Impact |
|----------|--------|--------|
| P1 Critical | 9 tables with exposed PII/credentials | Data breach risk |
| P2 High | 7 tables with permissive writes | Spam/data pollution |
| P3 High | 4 config/auth fixes | Key leakage, weak passwords |
| P4 Medium | 5 tables over-exposing data | Privacy violations |
| P5 Low | 1 React warning | None |

All fixes are **database migration only** (RLS policy updates) except the Google Maps key fix (edge function edit) and leaked password protection (auth config). No UI changes needed. No routes are broken or 404ing --- the issues are all at the data access layer.

