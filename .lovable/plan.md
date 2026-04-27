# Three Growth Engines: Cover Marketplace, Pupil Referrals, Pass Report

Three high-leverage features that compound: cover keeps revenue when an instructor is sick, referrals turn pass moments into new pupils, and the pass report PDF generates social proof.

---

## 1. Instructor Cover/Swap Marketplace

When an instructor marks themselves unavailable, their lessons in that window are auto-offered to nearby instructors with capacity.

### Database

New tables:

- **`cover_offers`** — one per lesson being offered
  - `lesson_id`, `requesting_instructor_id`, `pupil_id`, `lesson_start`, `lesson_duration`, `pickup_lat/lng`, `pickup_postcode`, `status` (`open` | `claimed` | `expired` | `cancelled`), `claimed_by_instructor_id`, `claimed_at`, `expires_at`, `commission_pct` (default 15)
- **`cover_offer_recipients`** — fan-out per nearby instructor (for notifications + RLS read access)
  - `cover_offer_id`, `instructor_id`, `distance_miles`, `notified_at`, `viewed_at`, `declined_at`
- **`cover_preferences`** on `instructors` (extend existing table)
  - `accepts_cover_lessons` boolean (default false — opt-in)
  - `cover_max_distance_miles` (default 10)
  - `cover_min_notice_hours` (default 2)
  - `cover_commission_share_pct` (default 15) — what they pay back to the original instructor

### Logic

- New page `/instructor/availability` gets an **"Offer for cover"** action on lessons that fall during a marked-unavailable window.
- Edge function `cover-offer-broadcast`:
  - Finds instructors within `cover_max_distance_miles` of pickup using haversine on `instructors.lat/lng`.
  - Filters: `accepts_cover_lessons = true`, no scheduling conflict, `cover_min_notice_hours` respected.
  - Inserts `cover_offer_recipients` rows + sends WhatsApp/SMS via existing Twilio integration ("Cover available: 1hr lesson, £35, 2.3 miles away. Tap to claim.").
- Edge function `cover-offer-claim`:
  - First-come wins (advisory lock on `cover_offer_id`).
  - Reassigns the `scheduled_lessons.instructor_id` to the claimer.
  - Triggers Google Calendar sync for both instructors.
  - Records commission (`commission_pct` of lesson price) as an instructor-to-instructor settlement entry.
- Auto-expire: cron job (every 5 min) marks `status='expired'` after `expires_at`.

### UI

- Instructor portal: new tile **"Cover Marketplace"** showing open offers within range (badge count).
- Pupil sees: notification "Your lesson on [date] is now with [new instructor]. Same time, same pickup."
- Settings page (Instructor): toggle + radius slider (5–25 miles) + commission share slider (10–25%).

---

## 2. Pupil Referral Loop (£10 credit each)

Extend the existing `pupil_referrals` infrastructure (currently awards 50 points) to deliver **£10 account credit** to both parties on first paid lesson.

### Database

- Extend `pupil_referrals`:
  - Add `referrer_credit_amount` (default `10.00`), `referred_credit_amount` (default `10.00`)
  - Add `credit_awarded_at` timestamp
- Update `award_referral_bonus()` trigger:
  - Instead of (or in addition to) reward_points, call `increment_pupil_balance(referrer_id, 10)` and `increment_pupil_balance(referred_id, 10)` when status flips to `completed`.
  - Mark `credit_awarded_at = now()`.
- New trigger on `pupils` rows where `test_passed` flips to `true`:
  - Send WhatsApp/email: "Congrats on passing! Share your instructor with friends — you both get £10 off lessons."
  - Includes pre-built shareable link `https://drive365.co.uk/r/{referral_code}`.

### Edge Function

- `referral-share-prompt`: triggered post-pass (or manually). Generates personalised share copy + WhatsApp click-to-chat link + SMS link.

### UI

- New `/pupil/referrals` page: hero ("Earn £10. Give £10."), referral code, copy/share buttons (WhatsApp, SMS, Email, link), list of pending + completed referrals with credit earned.
- Add **PassCelebrationSheet** that pops on first login after `test_passed=true`: "You passed! Share with friends and you both get £10."
- Instructor dashboard: new widget **"Referrals This Month"** (count + £ revenue from referred pupils).

### Public referral landing

- `/r/:code` route — shows instructor card (photo, area, pass rate), pre-fills the referral_code in signup, sends the £10 to both on first paid lesson.

---

## 3. Annual Pass Report PDF

When a pupil's `test_passed` flips to `true`, generate a celebratory PDF: progress chart, total mileage, hours, manoeuvres mastered, instructor signature.

### Edge Function

- `generate-pass-report` (Deno + jsPDF or `pdf-lib`):
  - Inputs: `pupil_id` (verified via RLS).
  - Aggregates from existing tables:
    - `scheduled_lessons` → total hours, lesson count, date range
    - `mileage_logs` → total miles driven
    - `lesson_telematics` → safety score average, harsh events count
    - `pupil_competency_progress` (DVSA syllabus) → list of competencies marked complete
    - `payment_history` → total invested
  - Uses Drive365 brand (logo, colours per memory).
  - Layout:
    1. Cover: "[Pupil Name] — Driver Since [pass date]" with instructor name + photo
    2. Stats grid: Hours, Miles, Lessons, Manoeuvres mastered, Safety score
    3. Progress chart (bar/radar) of 27 DVSA competencies
    4. Mileage map sketch (route summary if telematics data exists, else skip)
    5. Instructor message + signature line + Drive365 footer
  - Saves to `pupil-avatars` bucket (existing, public) at `pass-reports/{pupil_id}.pdf` and returns signed URL (or marks public for sharing).

### Triggering

- Trigger when `pupils.test_passed` flips `false → true`:
  - Calls `generate-pass-report` via `pg_net`.
  - Records URL in new column `pupils.pass_report_url`.
  - Sends WhatsApp/email to pupil with download link + share copy.
  - Surfaces in the pass celebration sheet (#2 above) with a "Download your Driver Report" button.

### UI

- `/pupil/pass-report` page renders an inline preview (iframe of the PDF) plus social share buttons (Instagram story template, WhatsApp, Twitter/X).
- Instructor portal: new tab on pupil profile **"Pass Report"** to re-generate or share.

---

## Files to create

**Edge functions:**
- `supabase/functions/cover-offer-broadcast/index.ts`
- `supabase/functions/cover-offer-claim/index.ts`
- `supabase/functions/cover-offer-expire/index.ts` (cron)
- `supabase/functions/referral-share-prompt/index.ts`
- `supabase/functions/generate-pass-report/index.ts`

**Components/pages:**
- `src/pages/instructor/CoverMarketplace.tsx`
- `src/components/instructor/CoverPreferencesCard.tsx`
- `src/components/instructor/OfferLessonForCoverDialog.tsx`
- `src/pages/pupil/PupilReferrals.tsx`
- `src/components/pupil/PassCelebrationSheet.tsx`
- `src/components/instructor/dashboard/CoverInboxTile.tsx`
- `src/components/instructor/dashboard/ReferralsThisMonthWidget.tsx`
- `src/pages/pupil/PassReport.tsx`
- `src/pages/public/ReferralLanding.tsx` (route `/r/:code`)

**Migrations:**
- New tables `cover_offers`, `cover_offer_recipients` with RLS via `get_instructor_id_for_user`.
- Extend `instructors` with cover preferences columns.
- Extend `pupil_referrals` with credit columns + amend trigger.
- Add `pupils.pass_report_url` column + trigger calling `generate-pass-report`.
- Schedule `cover-offer-expire` cron every 5 min (insert tool, not migration).

## Files to edit

- `src/routes/pupilRoutes.tsx` + instructor/public routes — three new pages.
- `src/pages/AdminPortal.tsx` — admin view of cover offers + referral stats.
- `src/components/instructor/dashboard/ReferralStatsWidget.tsx` — show £ instead of points.
- Memory: add `mem://features/marketplace/cover-and-referrals` capturing the rules.

## Out of scope (v1)

- Inter-instructor settlement automation (the commission is recorded but admin reconciles manually for v1).
- Multi-instructor cover bidding (first-come-first-served only).
- PDF localisation (English only).
- Editable PDF templates per instructor (single Drive365 template).

## Open question

**Cover commission flow:** When Instructor B covers Instructor A's lesson, the pupil already paid Instructor A. Two options:
1. **Credit transfer** — A transfers full lesson amount to B (minus 15% admin fee that stays with A as "finder's fee").
2. **B keeps full payment + pays A 15% finders fee** — simpler reconciliation.

I recommend option 2 (simpler, B has more incentive to accept). Confirm before I build the commission RPC.
