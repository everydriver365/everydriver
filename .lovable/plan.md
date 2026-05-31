# DSM Quote System — Implementation Plan

Additive feature spanning DSM instructor portal, admin panel, and Drive365 pupil-facing pages. Built on the existing (empty) `quotes` table — extended in place.

---

## 1. Database changes

### 1a. Extend `public.quotes`
- Add: `quote_ref text unique` (human ID like `Q-2026-0001`, generated via sequence + trigger), `price_pence integer not null default 0`, `deposit_pence integer not null default 0`, `terms text`, `valid_until timestamptz`, `sent_at`, `viewed_at`, `declined_at`, `cancelled_at`, `last_reminder_at`.
- Convert `status` from free-text to enum `quote_status` = `draft|sent|viewed|accepted|declined|expired|cancelled`.
- Keep legacy numeric `price` / `deposit_amount` columns (zero rows, no back-fill needed). All new code reads/writes pence columns only.
- Indexes: `(instructor_id, status, created_at desc)`, `(token)`, `(quote_ref)`.
- RLS: instructor sees own (`get_instructor_id_for_user(auth.uid())`), admins via `has_role`, public can `select` a single row by `token` (anon grant scoped through policy).

### 1b. New `public.quote_activity_log`
- Columns: `id`, `quote_id` (fk), `event` (`created|sent|viewed|reminder_sent|accepted|declined|cancelled|expired|booking_created|note`), `actor_type` (`instructor|pupil|system|admin`), `actor_id`, `metadata jsonb`, `created_at`.
- RLS: instructor reads own quote's log, admin reads all, system writes via service role.

### 1c. New `public.quote_bookings`
- Columns: `id`, `quote_id` (fk unique), `instructor_id`, `pupil_id` (nullable — created on accept if email matches), `pupil_name`, `pupil_email`, `pupil_phone`, `pupil_postcode`, `total_hours numeric`, `price_pence`, `deposit_pence`, `status` (`pending_schedule|partially_scheduled|fully_scheduled|cancelled`), `accepted_at`, `created_at`, `updated_at`.
- No FK into `scheduled_lessons` — actual lessons booked later via existing scheduler, linked optionally via new nullable `scheduled_lessons.quote_booking_id` (additive column, no behaviour change).
- RLS mirrors quotes.

### 1d. Sequence + trigger
- `quote_ref_seq` + `BEFORE INSERT` trigger setting `quote_ref = 'Q-' || extract(year from now()) || '-' || lpad(nextval('quote_ref_seq')::text, 4, '0')` when null.

### 1e. GRANTs
All new tables: `service_role` full, `authenticated` CRUD, `anon` SELECT only on `quotes` (scoped by token policy).

---

## 2. Edge functions (new)

- `quote-create` — instructor-auth; validates payload, inserts `quotes` row + activity log entry, returns `{ id, quote_ref, token, public_url }`.
- `quote-send` — instructor-auth; marks `status='sent'`, sets `sent_at`, enqueues email via `process-email-queue` (template: quote-sent), optional SMS, logs activity.
- `quote-public-get` — anon; reads quote by `token`, on first hit sets `viewed_at` + `status='viewed'` (if currently `sent`), logs activity. Returns sanitized payload (no instructor PII beyond business_name, profile_image_url, brand_colour, phone).
- `quote-accept` — anon (token-gated); transitions `status='accepted'`, writes `accepted_at`, creates `quote_bookings` row, attempts to link/create `pupils` row by email, logs activity, fires `send-push-notification` to instructor + queues confirmation email. **No payment** — instructor follows up using existing flows.
- `quote-decline` — anon (token-gated); status → `declined`, captures optional reason in activity log, notifies instructor.
- `quote-cancel` — instructor-auth; only if not yet accepted.
- `quote-reminder` (cron, daily) — finds `status in (sent, viewed)` AND `valid_until` within 48h AND `last_reminder_at is null`, sends reminder email, marks `last_reminder_at`. Same job expires quotes past `valid_until` → `status='expired'`.

All deploy `verify_jwt=false`; functions that need instructor identity validate the JWT in-code via `get_instructor_id_for_user`.

---

## 3. DSM Instructor Portal (new pages under `/instructor/quotes`)

- `/instructor/quotes` — list (table desktop / portal-card rows mobile), filter by status, search by ref/pupil name/email, sort. KPI strip: Sent, Viewed, Accepted (last 30d), Conversion %.
- `/instructor/quotes/new` — multi-step form: pupil details → package (course type, hours, price £, deposit £) → terms & validity (default 14 days) → review. Money inputs accept £ but persist pence (`Math.round(value*100)`).
- `/instructor/quotes/:id` — detail view: status timeline (from activity log), full breakdown, actions (Send, Resend, Copy link, Cancel, Mark accepted manually). Shows linked `quote_bookings` once accepted with "Schedule lessons" CTA → deep-link to existing scheduler pre-filled with `quote_booking_id`.
- Uses `--portal-*` tokens, `PortalCard`, `PortalButton`, `.portal-list`, radius scale (cards 12, sheets 16, pills 999). Desktop indigo/teal theme per `mem://style/desktop-portal-theme-2026`. Mobile layout untouched unless instructor portal already has a mobile shell — additive routes only.

---

## 4. Admin panel (new section `/admin/quotes`)

- Cross-instructor list with same filters + instructor column.
- Per-quote drill-down read-only (status, activity log, linked booking).
- Aggregate metrics: total sent / accepted / accepted value (sum of accepted `price_pence`) by month, top instructors by acceptance rate.
- All queries chain `.eq('is_network_placeholder', false)` on any instructor join (per memory).

---

## 5. Drive365 pupil-facing public page

- New route `/quote/:token` on `drive365.co.uk` domain only (single canonical URL).
- Server-side SEO meta: `<title>Quote {quote_ref} · {instructor business_name}</title>`, no-index (`<meta name="robots" content="noindex">`) since token-gated.
- Layout: instructor header (logo, business_name, location_name, brand_colour accent), package summary, price breakdown (£ formatted), terms, validity countdown, primary CTA **Accept Quote**, secondary **Decline**.
- Accept flow: confirmation modal → calls `quote-accept` → success state showing "We'll be in touch shortly to schedule your lessons" + instructor contact details. No payment step.
- Decline flow: optional reason textarea → calls `quote-decline` → thank-you state.
- Expired/cancelled states render explanatory message, no actions.

---

## 6. Notifications

- **Instructor**: push (`send-push-notification`) on viewed (first time), accepted, declined.
- **Pupil**: emails via `process-email-queue` for quote-sent, quote-reminder, quote-accepted-confirmation.
- All templates new files under existing email template directory; no new infra.

---

## 7. Currency handling (project rule)
- All money columns and edge-function payloads in pence (integer).
- All UI inputs convert via `Math.round(value * 100)` on submit, `(pence / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })` on display.
- No floating-point arithmetic anywhere in quote totals.

---

## 8. Out of scope (explicit)
- No changes to existing `course_enquiries`, `scheduled_lessons` behaviour (only an additive nullable `quote_booking_id` column on `scheduled_lessons`).
- No payment collection in v1 (deferred — instructor uses existing Square/GoCardless/etc. flows after accept).
- No mobile-shell layout changes to instructor portal (per mobile update policy memory).
- No edits to `quotes` legacy `price`/`deposit_amount` columns beyond ignoring them.

---

## 9. Verification
- Migration applies cleanly, types regenerate.
- Create → send → public view → accept → booking row appears → instructor notified.
- Decline path, cancel path, expiry cron path each exercised via `curl_edge_functions`.
- Admin list visible only to admin role; instructor list scoped to own `instructor_id`.
- RLS: anon can read by token only; cannot list quotes.
