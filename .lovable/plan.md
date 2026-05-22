
# Pupil self-booking — fix two actively broken gaps

## Pre-implementation findings (changes the prompt slightly)

- `reschedule_requests` columns confirmed: `id, pupil_id, lesson_id, instructor_id, requested_date, requested_time, original_date, original_time, reason, status, created_at, responded_at`. ✅
- `instructor_booking_settings.require_approval` exists and is already honoured in `PupilPortalSchedule.tsx` line 512 (its inline pupil-reschedule flow). **Only `SelfBookingCalendar.tsx` line 184 ignores it** — confirming Gap 2 scope.
- `UpcomingLessonCard.tsx` already renders a "Pending approval" badge for `booking_status === 'pending_approval'`, so pupil-side surfacing exists.
- `PupilNotifyType` exists in `src/lib/notificationTypes.ts` and is mirrored at `supabase/functions/_shared/notification-types.ts`. Existing types include `BOOKING_CONFIRMED`, `LESSON_CANCELLED`, `LESSON_REMINDER`. Missing: `LESSON_RESCHEDULED`, `RESCHEDULE_DECLINED`, `BOOKING_DECLINED`.
- **No instructor UI currently reads `scheduled_lessons` where `booking_status = 'pending_approval'`** — confirms a `PendingBookingsCard` is needed.
- `RescheduleRequestForm.tsx` only writes the row and shows a toast — no notification fired. Will add `notify-instructor` call.
- `notify-pupil` and `notify-instructor` edge functions both exist.

---

## PART 1 — Gap 1: Reschedule request approval queue

**New:** `src/components/instructor/RescheduleRequestsCard.tsx`
- Queries `reschedule_requests` where `instructor_id = current` and `status = 'pending'`, joined to `pupils(name)` and `scheduled_lessons(lesson_date, start_time, duration_minutes)`.
- Row layout: pupil name, original date/time → requested date/time (+ optional time), reason text, Accept / Decline buttons.
- **Accept**: pre-check clash via `checkLessonClash`; update `scheduled_lessons` row (`lesson_date`, `start_time`) for `lesson_id`; update `reschedule_requests` (`status='approved'`, `responded_at=now()`); call `notify-pupil` with `LESSON_RESCHEDULED`; toast success; invalidate query.
- **Decline**: optional reason via small textarea; update `reschedule_requests` (`status='declined'`, `responded_at=now()`); call `notify-pupil` with `RESCHEDULE_DECLINED`; toast.
- Loading skeleton + error state + empty state ("No pending reschedule requests").
- Returns `null` when zero pending rows (self-hides — same pattern as `ActiveGapOffersList`).
- Styling: DSM tokens, `rounded-2xl`, `#F4F7F6` surrounding bg (per design memory).

**Mount:** add to `src/components/instructor/MobileHomeDSM2026.tsx` near the existing `ActiveGapOffersList` placement. Standalone card, not folded into Needs Attention (it has explicit actions, doesn't fit that pattern).

**Pupil-side notification on submit:** in `RescheduleRequestForm.tsx` after successful insert, fire `supabase.functions.invoke('notify-instructor', { body: { instructor_id, type: 'reschedule_requested', pupil_id, lesson_id, requested_date, requested_time } })`. Non-blocking (don't throw on notify failure).

---

## PART 2 — Gap 2: Enforce `require_approval` in SelfBookingCalendar

**Edit `src/components/pupil-portal/SelfBookingCalendar.tsx` only:**
- Read `effectiveSettings.require_approval` (already loaded into `settings`).
- In `bookLessonMutation.mutationFn`: branch the insert payload — if `require_approval`, use `status: 'pending', booking_status: 'pending_approval'`; otherwise existing `status: 'scheduled', booking_status: 'confirmed'`.
- Return the chosen status from the mutation; in `onSuccess`, if pending: **skip confetti** and show `toast({ title: 'Lesson request sent', description: 'Waiting for your instructor to confirm.' })`. Otherwise existing confetti + "Lesson Booked! 🎉" path.

**New:** `src/components/instructor/PendingBookingsCard.tsx`
- Queries `scheduled_lessons` where `instructor_id = current` and `booking_status = 'pending_approval'`, joined to `pupils(name)`.
- Row: pupil name, requested date/time, duration.
- **Accept**: update row to `booking_status='confirmed', status='scheduled'`; `notify-pupil` with `BOOKING_CONFIRMED`; toast.
- **Decline**: update row to `booking_status='declined', status='cancelled', cancellation_reason='Declined by instructor'`; `notify-pupil` with `BOOKING_DECLINED`; toast.
- Self-hides at zero rows. Same styling pattern as `RescheduleRequestsCard`.

**Mount:** alongside `RescheduleRequestsCard` in `MobileHomeDSM2026.tsx`.

---

## PART 3 — Notification types

Add to **both** `src/lib/notificationTypes.ts` and `supabase/functions/_shared/notification-types.ts` `PupilNotifyType` const:
- `LESSON_RESCHEDULED = 'lesson_rescheduled'`
- `RESCHEDULE_DECLINED = 'reschedule_declined'`
- `BOOKING_DECLINED = 'booking_declined'`
- (`BOOKING_CONFIRMED` already exists — do not duplicate.)

Add cases to `supabase/functions/notify-pupil/index.ts` switch with concise title/body copy for each new type:
- `lesson_rescheduled`: "Lesson rescheduled" / "Your new lesson time is {date} at {time}."
- `reschedule_declined`: "Reschedule declined" / "Your instructor couldn't accommodate the new time."
- `booking_declined`: "Lesson request declined" / "Your instructor couldn't confirm the requested slot."

---

## PART 4 — Verified clean checklist

- No edits to: public `/book/:instructorId`, `BookingSummary.tsx`, `booking_enquiries`, `ai_booking_requests`, `FamulorHub`, `instructor_booking_settings` schema.
- `SelfBookingCalendar` change is purely a branch on `require_approval`; no other logic touched.
- `PupilPortalSchedule.tsx` reschedule branch already correct — left as-is.
- Both new cards self-hide at zero rows (no empty visual clutter on dashboard).
- Notification types stay in sync between client lib and edge `_shared`.
- `notify-instructor` call from `RescheduleRequestForm` is non-blocking.

---

## PART 5 — Deferred (explicitly out of scope)

- Gap 3 (AI booking requests dashboard tile)
- Gap 4 (`instructor_assigns` pupil request flow — would need new `lesson_requests` table)
- Gap 5 (`first_lesson_only` enforcement)
- Realtime subscription on the two new cards (poll-on-mount is sufficient for v1)
- Bulk-accept and counter-offer flows
- Reschedule conflict resolution beyond clash pre-check (e.g. auto-suggesting nearest free slot)

---

## Files touched

**New (3):**
- `src/components/instructor/RescheduleRequestsCard.tsx`
- `src/components/instructor/PendingBookingsCard.tsx`

**Edited (5):**
- `src/components/pupil-portal/SelfBookingCalendar.tsx` — branch on `require_approval`
- `src/components/pupil-portal/RescheduleRequestForm.tsx` — fire `notify-instructor`
- `src/components/instructor/MobileHomeDSM2026.tsx` — mount both cards
- `src/lib/notificationTypes.ts` — add 3 types
- `supabase/functions/_shared/notification-types.ts` — add 3 types
- `supabase/functions/notify-pupil/index.ts` — add 3 cases

No DB migration required (all columns and tables already exist).
