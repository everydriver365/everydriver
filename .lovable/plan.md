## Goal

Surface paid `course_reservations` to the instructor so they know which pupils have reserved a start date and need lessons added to the calendar.

## Where it lives

Mount on the existing **`/instructor/pending-scheduling`** page (already used for prepaid pupils awaiting scheduling — the perfect home). Render the new card directly under the info banner, above the existing pupils list. No new route required.

## New component

`src/components/instructor/ReservationsAwaitingSchedulingCard.tsx`

- Query `course_reservations` filtered by `instructor_id`, `payment_status = 'paid'`, `status IN ('awaiting_scheduling','partially_scheduled')`, ordered by `start_date asc`.
- Joins `pupils` for name/phone/email.
- Renders nothing if the list is empty (zero noise for instructors not using the feature).
- Per row shows:
  - Pupil name
  - Hours remaining (`total_hours − hours_scheduled`) with a "partially scheduled" tag when applicable
  - Start date + computed "Finish by" date (`start_date + completion_window_weeks`)
  - Allowed days (Mon, Wed, Fri…) and time windows (Mornings/Afternoons/Evenings)
  - Hours-per-week cap
  - Action buttons: **Call**, **WhatsApp**, **Email** (using `pupils.phone` / `pupils.email`)
  - **Add lesson** button → `/instructor/schedule?action=add&pupilId=…&reservationId=…`
- Uses existing shadcn primitives (Card, Button, Badge) and follows portal radii (rounded-2xl rows).

## Page edit

`src/pages/InstructorPendingScheduling.tsx`

- Import the new card.
- Mount `<ReservationsAwaitingSchedulingCard instructorId={instructorId} />` immediately below the existing info banner (around line ~150).

## Out of scope

- Pre-filling the scheduler's day/time pickers from the reservation — for now the link just carries `reservationId` so a later iteration can pre-filter inside the scheduler.
- Linking each created `scheduled_lessons` row to `reservation_id` from the scheduler UI (the DB column + trigger already exist; the scheduler write-path edit is a follow-up).
- New dashboard tile/quick-action entry. Pupils with paid reservations already route instructors here via the existing "Pending Scheduling" surface.

## Verification

1. With no paid reservations, the card is invisible (returns null).
2. After a successful Ryft reservation payment, the row appears with correct hours remaining, days, time windows, finish-by date, and contact buttons.
3. "Add lesson" navigates to the scheduler with the pupil + reservation in the URL.
4. Once enough `scheduled_lessons` are linked to the reservation, the existing trigger flips `status` to `completed` and the row drops off.
