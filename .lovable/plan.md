## Three growth instruments

All three are high-leverage at the 4k-instructor scale target. Each is independently shippable, but they share one new event table so they're best built together.

Note on real plan prices (the chat mentioned £34.99 → £7.99; the live `subscription_plans` table is **GPS + Health £29.99 → All-In £4.99**). Plan uses the real values.

---

### 1. Onboarding completion funnel telemetry

**Goal:** Know exactly where signups die — signup started → personal details → location → vehicle → plan selection → payment → first pupil added → first lesson scheduled → first payment received.

**Build:**
- New table `funnel_events` (instructor_id, event_name, event_data jsonb, occurred_at) — single append-only event log, RLS so instructors only see their own, admins see all.
- Helper hook `useFunnelTracker()` — fires `funnel.track(name, data)` from each onboarding step (`StepPersonalDetails`, `StepLocation`, `StepVehicle`, `StepPlanSelection`, `StepPayment`, `StepComplete`) and from three lifecycle moments: first pupil insert, first scheduled_lesson insert, first successful payment_history row.
- DB trigger on `pupils`, `scheduled_lessons`, `payment_history` that inserts a one-shot `first_*` event per instructor (idempotent via partial unique index on `(instructor_id, event_name) where event_name like 'first_%'`).
- Admin page `/admin/funnel` — cohort table (signup week × stage) showing absolute counts and conversion %, plus a "median time to next stage" column. Built with existing admin layout + recharts.

**Why now:** Without this you're guessing where to invest. With 4k-user ambition, a 2pp lift at any stage is worth real money.

---

### 2. Dormant pupil auto re-engagement (SMS + WhatsApp)

**Goal:** Auto-recover pupils who haven't booked in 21 days — currently `DormantPupilsCard` shows them but action is manual.

**Build:**
- Reuse existing `dormant_outreach_log` pattern via new table `pupil_reengagement_log` (pupil_id, channel, sent_at, message_template) — prevents re-sending within 30 days.
- Edge function `dormant-pupil-reengage` (scheduled daily 10:00 UK via pg_cron):
  1. For every active pupil with no non-cancelled lesson in 21+ days AND no entry in `pupil_reengagement_log` in last 30 days,
  2. Pick channel: WhatsApp if `pupil.whatsapp_opt_in` and `phone` E.164, else SMS via Twilio (uses existing `TWILIO_*` secrets and existing WhatsApp config).
  3. Template: "Hi {name}, it's {instructor_name} — been a while! Reply BOOK to grab a slot, or tap {short_link} to view my diary." Short link goes to existing pupil portal booking page.
  4. Log to `pupil_reengagement_log`; insert `funnel_events` row `reengagement.sent`.
- Instructor toggle in Settings → Communication: "Auto re-engage dormant pupils after 21 days" (default OFF — opt-in for compliance). Per-instructor frequency cap of 5/day.
- New `DormantPupilsCard` gets a status badge: "Auto-message sent 3 days ago" instead of just "X days dormant".
- Admin dashboard tile: total messages sent / replies / bookings attributed (joined via `funnel_events`).

**Compliance:** Twilio SMS Pumping Protection + Geo Permissions (UK only) — call out to user to enable in Twilio console after first deploy.

---

### 3. Subscription downgrade save flow

**Goal:** When an instructor switches GPS + Health (£29.99) → All-In (£4.99), intercept with retention offers before the change commits.

**Build:**
- New table `subscription_save_offers` (instructor_id, from_plan, to_plan, offer_type, offer_value, accepted_at, declined_at, expires_at). Offer types: `discount_50_3mo`, `pause_30d`, `pause_60d`, `keep_addon_only`.
- Modify `UpgradePlanSheet.tsx` (and `InstructorPlans.tsx` plan-change handler): when `newPlan.price_monthly < currentPlan.price_monthly`, route through new `<DowngradeSaveSheet>` instead of immediate change.
- `<DowngradeSaveSheet>` shows three options:
  1. **50% off for 3 months** — keeps GPS + Health at £14.99/mo for 3 cycles, then reverts to full £29.99. (Lifetime cap: one save offer per instructor per 12 months.)
  2. **Pause for 30 / 60 days** — sets `instructor_subscriptions.status='paused'` with `resume_at` date; suppresses GoCardless billing via existing pause flow in `gocardless-webhook` ignore logic.
  3. **Continue downgrade** — proceeds with original plan change.
- Backend edge function `subscription-save-apply` validates eligibility (no prior offer in 12mo), applies offer, updates GoCardless subscription via existing patterns, and writes `funnel_events` rows (`save_offer.shown`, `save_offer.accepted`, `save_offer.declined`).
- Admin analytics: new section on `/admin/subscriptions` showing save-offer acceptance rate and revenue retained.

**Why these offers:** A 50% discount for 3 months on £29.99 = £45 retained vs £0 if they downgrade and £0 if they churn entirely. Pause is even cheaper (zero discount cost, just deferred revenue) and high-acceptance for seasonal instructors.

---

## Build order

1. `funnel_events` table + tracker hook + DB triggers (foundation for all three).
2. Onboarding step instrumentation + admin funnel page.
3. Dormant re-engagement edge function + cron + opt-in toggle.
4. Downgrade save sheet + edge function + admin save-offer analytics.

Steps 3 and 4 can ship independently after step 1.

---

## Technical notes

- All new tables: RLS scoped via `public.get_instructor_id_for_user(auth.uid())` per project Core rule.
- Cron for dormant: `pg_cron` daily at 10:00 Europe/London; uses `net.http_post` per existing pattern.
- Twilio + WhatsApp: reuses existing connector configuration; no new secrets needed.
- GoCardless pause: writes a flag to `instructor_subscriptions` and short-circuits the next charge in `process-recurring-subscriptions`; no new GoCardless API surface.
- Save-offer eligibility check is server-side in the edge function (never trust the client) — prevents repeated discount abuse.
- All 3 features write to a single `funnel_events` stream so the admin funnel and the save-offer analytics share one query path.
