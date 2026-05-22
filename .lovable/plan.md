
# Grab a Gap — Implementation Plan

Build on existing `slot_offers` (realtime, unused fan-out columns) by adding a recipients table + atomic claim RPC + broadcast edge function. **Do not touch `gap_offers` (513 live SMS rows) or `cover_offers`.**

---

## PART 1 — Data Layer (single migration)

**New table `slot_offer_recipients`** (mirrors `cover_offer_recipients`):
- `id`, `slot_offer_id` (FK CASCADE), `pupil_id`, `instructor_id`, `notified_at`, `viewed_at`, `claimed_at`, `declined_at`, `distance_miles`, `created_at`
- Unique index `(slot_offer_id, pupil_id)`
- Added to `supabase_realtime` publication

**RLS on `slot_offer_recipients`:**
- Instructor: full CRUD where `instructor_id = get_instructor_id_for_user(auth.uid())`
- Pupil: SELECT where `pupil_id` matches their pupil record (via auth lookup pattern used elsewhere in pupil portal)
- UPDATE for pupil restricted to `viewed_at` only (claim happens via RPC)

**Extend `slot_offers`:**
- Add `status text default 'open'` with check `('open','filled','expired','cancelled')`
- Add pupil SELECT policy: pupils can read offers where they appear in `slot_offer_recipients`
- No pupil UPDATE policy — all state changes go through RPC

**RPC `claim_slot_offer(p_offer_id uuid, p_pupil_id uuid)`** (SECURITY DEFINER):
1. `SELECT ... FOR UPDATE` lock on `slot_offers`
2. Verify caller's auth maps to `p_pupil_id` (via pupil_id lookup); else `not_authorised`
3. Check `status = 'open'` else return `already_filled`
4. Verify recipient row exists; else `not_a_recipient`
5. Check `claimed_at IS NULL`; else `already_claimed`
6. INSERT `scheduled_lessons` row (date, times, instructor, pupil, status `confirmed`, lesson_type `standard`, pickup defaults pulled from pupil profile)
7. UPDATE recipient row: `claimed_at = now()`
8. UPDATE offer: `status='filled'`, `pupil_id`, `pupil_response='accepted'`, `pupil_responded_at=now()`
9. UPDATE all other open recipients: `declined_at = now()`
10. Return `jsonb { success, reason?, lesson_id? }`
- `GRANT EXECUTE` to `authenticated`

---

## PART 2 — Edge Functions

**`slot-offer-broadcast`** (POST, JWT-verified):
- Input: `{ instructor_id, slot_date, start_time, end_time, duration_mins, location_hint?, target: 'all_active' | string[], expires_in_hours? (default 4) }`
- Verifies caller is the instructor
- Inserts `slot_offers` row (`status='open'`, `instructor_approved=true`, `expires_at = now() + interval`)
- Resolves recipient pupil IDs (active, non-deleted pupils, or explicit list)
- **Cap 200**, log warning on overflow, truncate
- Bulk insert `slot_offer_recipients`
- Fires `notify-pupil` per recipient with `type: 'slot_offer'`, payload `{ offer_id, date, start_time, end_time, instructor_name, location_hint }`
- Returns `{ offer_id, recipient_count }`

**`slot-offer-expire`** (cron, hourly):
- Find `status='open' AND expires_at <= now()`
- Set `status='expired'`, mark recipients `declined_at`
- `notify-instructor` with summary "X gap offers expired unfilled"
- Audit log
- Cron job registered via `supabase--insert` (pg_cron + pg_net per project pattern)

**Config (`supabase/config.toml`):** add `verify_jwt = false` for `slot-offer-expire` only (cron-triggered). `slot-offer-broadcast` keeps JWT verification.

---

## PART 3 — Instructor UI

**`CancellationBackfillSheet.tsx`** — append a new "Grab a Gap" section *below* existing waitlist matching (do not remove or alter waitlist flow):
- Pre-populated: date, start time, duration
- Optional location hint text input
- Segmented control: `All active pupils` / `Select pupils` (uses existing `IOSSegmentedControl`)
- Conditional searchable multi-select pupil list (reuse existing pupil picker pattern)
- Expiry dropdown: 1h / 2h / 4h / 24h (default 4h)
- "Send Grab a Gap" button → `supabase.functions.invoke('slot-offer-broadcast')`
- Success toast: "Sent to X pupils — first to claim gets the slot"

**Active gap offers panel** — new component `ActiveGapOffersList.tsx`:
- Mounted on the instructor schedule screen
- Lists `slot_offers` where `status IN ('open','filled')` from last 7 days
- Realtime subscription on `slot_offers` + `slot_offer_recipients`
- Shows: date, time, status pill, recipients notified, time-remaining countdown
- Filled offers show claimer name (via pupil join)
- "Cancel offer" button on open offers → updates `status='cancelled'` + notifies recipients

---

## PART 4 — Pupil UI

**Rework `SlotOfferNotification.tsx`:**
- Add realtime subscription on `slot_offer_recipients` for this pupil (not just `slot_offers`)
- Fetch offers joined via recipients table (so we get only offers the pupil is invited to + `status='open'`)
- On display, fire UPDATE `viewed_at = now()` on recipient row
- Live countdown to `expires_at` ("Offer expires in 2h 34m")
- "Grab this slot" button → `supabase.rpc('claim_slot_offer', { p_offer_id, p_pupil_id })`
- Handle return states:
  - `success: true` → green confirmation "You got it! Lesson booked", auto-dismiss 3s
  - `already_filled` → grey "Sorry, someone else grabbed this slot first", no retry
  - `already_claimed` → "You've already claimed this slot"
  - `not_a_recipient` / `not_authorised` → error toast + console log

**Push handling (`usePupilPushNotifications`):**
- Route `data.type === 'slot_offer'` deep link to `/pupil/offers/:offerId`
- If offer status is non-open on open, render "This slot was already taken" — no claim button

---

## PART 5 — Notification Types

- Add `SLOT_OFFER = 'slot_offer'` to `PupilNotifyType` (already exists in `PushDataType`) in both:
  - `src/lib/notificationTypes.ts`
  - `supabase/functions/_shared/notification-types.ts`
- Add case in `notify-pupil` switch:
  - Title: `"A lesson slot is available — grab it now"`
  - Body: `"{date} at {time} with {instructor}. First to claim gets it."`
  - Category: `NotifyCategory.LESSON`, importance: `NotifyImportance.IMPORTANT`

---

## Verification per round
1. Migration: linter clean, RLS policies present, RPC callable
2. Edge: `curl_edge_functions` broadcast smoke test + cron registration confirmed
3. Instructor UI: build clean, toast fires, offer appears in list
4. Pupil UI: realtime updates, claim returns success, lesson appears in schedule
5. Race-condition sanity: second `claim_slot_offer` call returns `already_filled`

## Hard constraints honoured
- `gap_offers`, `send-gap-sms`, SMS flow untouched
- `cover_offers` untouched
- Atomic claim via `FOR UPDATE` lock — no double-booking
- Pupils only see specific offer rows via recipients join — no diary leakage
- Existing waitlist matching in `CancellationBackfillSheet` preserved

Proceed?
