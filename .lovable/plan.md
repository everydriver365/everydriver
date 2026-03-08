

## Assessment: 3 of 5 Features Already Exist

After reviewing your codebase, here's what I found:

| # | Feature | Status |
|---|---------|--------|
| 1 | Pupil Portal | **Already built** — login, progress tracking, payment history, self-booking, lesson feedback, reflective logs all exist |
| 5 | Broadcast Messaging | **Already built** — `BroadcastMessageSheet` with template library, status filters (active/on hold/inactive/passed), bulk SMS via Twilio |
| 7 | Conditional Intake / Digital Waivers | **Already built** — `booking_intake_questions` table with configurable fields + `TermsSignatureModal` with U18 parent consent, dual signature pads, and signature storage |
| 3 | Smart Buffer Time | **Partially built** — needs upgrade |
| 4 | Recurring Subscriptions | **Not built** — needs new system |

---

## What Needs Building

### Feature 3: Smart Buffer Time (Travel-Aware Scheduling)

Currently `buffer_minutes` is a flat value (e.g. 15 min) applied uniformly. The `useLessonTravelTimes` hook already calculates postcode-to-postcode travel times between lessons and shows warnings. The upgrade is to make the **booking availability engine** use travel time instead of flat buffer.

**Database changes:**
- Add `smart_buffer_enabled` (boolean, default false) column to `instructors` table
- Add `smart_buffer_mode` (text, default 'flat') — values: `flat`, `travel_time`, `travel_time_plus` (travel + fixed padding)
- Add `smart_buffer_padding_minutes` (integer, default 5) — extra minutes added on top of travel time

**UI changes:**
- New section in Scheduling Settings: toggle between flat buffer vs smart (travel-aware) buffer
- When smart is enabled, show padding minutes input

**Logic changes:**
- Update the availability calculation (used by public booking and pupil self-booking) to:
  1. When `smart_buffer_mode = 'travel_time'`: calculate drive time between the previous lesson's postcode and the candidate slot's pickup postcode, block if insufficient gap
  2. When `smart_buffer_mode = 'travel_time_plus'`: same + add padding minutes
- Reuse existing HERE API / travel time calculation pattern from `useLessonTravelTimes`
- Add a new edge function `check-travel-buffer` that accepts two postcodes + available gap and returns whether the slot is feasible

**Files:** Update scheduling settings page, new edge function, update availability hooks

---

### Feature 4: Recurring Lesson Subscriptions with Auto-Charging

Currently `AddLessonSheet` creates recurring lessons (weekly for N weeks) but there's no subscription model with automatic billing.

**Database changes:**
- New table `pupil_subscriptions`: `id`, `instructor_id`, `pupil_id`, `day_of_week` (0-6), `start_time`, `duration_minutes`, `pickup_postcode`, `pickup_address`, `price_per_lesson`, `payment_method` (text: 'manual', 'gocardless', 'square'), `status` (text: 'active', 'paused', 'cancelled'), `next_lesson_date`, `created_at`, `updated_at`
- RLS: instructor can CRUD own, pupil can read own

**Edge function:** `process-recurring-subscriptions`
- Runs daily via cron
- For each active subscription where `next_lesson_date <= today + 7 days`:
  1. Create a `scheduled_lessons` record for the next occurrence
  2. If payment method is GoCardless/Square, trigger a charge for `price_per_lesson`
  3. Advance `next_lesson_date` by 7 days
  4. Skip if that date falls on an instructor holiday (check `instructor_date_overrides`)

**UI changes:**
- New page `/instructor/subscriptions` — list of active pupil subscriptions
- "Add Subscription" sheet: pick pupil, day of week, time, duration, price, payment method
- Pupil can view their subscription in the pupil portal
- Ability to pause/resume/cancel subscriptions
- Add tile to home screen

**Files:** New page `InstructorSubscriptions.tsx`, new components in `src/components/instructor/subscriptions/`, new edge function, route + tile additions

---

### Summary

| Feature | DB Changes | New Pages | Edge Functions |
|---------|-----------|-----------|----------------|
| Smart Buffer Time | 3 columns on instructors | 0 (settings update) | 1 |
| Recurring Subscriptions | 1 table | 1 | 1 (+ cron) |

