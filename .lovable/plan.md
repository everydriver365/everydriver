

## Scaling to 4,000 Users: Security Hardening and Reliability Plan

The security scan reveals **critical vulnerabilities** that must be fixed before onboarding more users. Here is everything needed, in priority order.

---

### PHASE 1: Critical Security Fixes (must do first)

These are active data breaches -- real user data is exposed right now.

**1. Pupil personal data publicly readable**
The `pupils` table has an anonymous SELECT policy (`Anon can select pupil by id` with `USING (true)`), exposing names, emails, phones, addresses, medical notes, emergency contacts, and DVLA details to anyone on the internet. Fix: remove this policy and scope access to authenticated instructors only.

**2. Instructor OAuth tokens leaked**
The `instructors` table's public policy exposes Square payment tokens in plaintext alongside personal details. Fix: create a public view with only safe fields (name, bio, image, area) and restrict the full table to authenticated owners.

**3. Leftover debug policies (`temp_rork_*`)**
18+ tables have `temp_rork_anon_read` and `temp_rork_anon_update` policies granting anonymous access to one instructor's data (including GPS, payments, lessons). Fix: drop all `temp_rork_*` policies immediately.

**4. WhatsApp, parent, and live chat data publicly writable**
`whatsapp_conversations`, `parent_conversations`, `parent_messages`, `live_chat_sessions`, and `live_chat_messages` all have `USING (true)` policies allowing anonymous read/write. Fix: scope to owning instructor.

**5. Broken RLS policies (wrong ID comparison)**
Multiple tables compare `instructor_id = auth.uid()` but `instructor_id` references `instructors.id`, not the auth UUID. These policies silently fail, denying legitimate access or allowing unauthorized access. Fix: use `get_instructor_id_for_user(auth.uid())`.

**6. Expense receipts open to anonymous upload/delete**
The `expense-receipts` storage bucket lets anyone upload, overwrite, or delete financial documents. Fix: add folder-based ownership checks.

---

### PHASE 2: Webhook Security and Payment Integrity

**7. Webhook signature verification**
`square-webhook` and `gocardless-webhook` accept any POST without HMAC verification. Anyone can spoof a payment event and credit balances. Fix: add signature verification using `SQUARE_WEBHOOK_SIGNATURE_KEY` and `GOCARDLESS_WEBHOOK_SECRET`.

**8. Payment minimum amount validation**
No minimum payment check exists. Fix: enforce minimum of 50p across all payment edge functions.

**9. Webhook idempotency**
No duplicate payment ID checks. Fix: add `payment_id` uniqueness checks to prevent double-crediting.

---

### PHASE 3: Auth Hardening

**10. Enable leaked password protection (HIBP)**
Currently disabled. Fix: enable via auth configuration so compromised passwords are rejected at signup.

**11. Realtime channel authorization**
No RLS on `realtime.messages` -- any authenticated user can subscribe to admin channels. Fix: add channel-scoped RLS policies.

---

### PHASE 4: Infrastructure for 4,000 Users

**12. Upgrade Lovable Cloud instance**
267 tables with 4,000 concurrent users will need a larger compute instance. Go to Cloud > Overview > Advanced settings and select a larger instance size.

**13. Add database indexes**
High-traffic queries (pupils by instructor, lessons by date, GPS points by session) need composite indexes for sub-100ms response times at scale.

**14. Native deployment (Despia/Capacitor)**
For reliable live tracking on mobile, wrap the app in a native shell as discussed previously.

---

### Execution Approach

Due to the volume of RLS policy changes (~30+ policies across ~25 tables), this will be done in batches:
- **Batch 1**: Drop `temp_rork_*` policies and fix anonymous data exposure (pupils, instructors, WhatsApp, parent, live chat)
- **Batch 2**: Fix broken `auth.uid()` comparisons and storage bucket policies
- **Batch 3**: Add webhook signature verification and payment guardrails
- **Batch 4**: Enable HIBP, add Realtime RLS, add performance indexes

Each batch is a database migration. The app will continue working throughout -- we are tightening access, not changing schema.

Shall I proceed?

