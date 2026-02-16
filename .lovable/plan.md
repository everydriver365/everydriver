

# Add "Reserve" Button to Available Test Slots

## Overview

Add a "Reserve" button to each slot card that inserts a reservation request into a new database table and sends an urgent alert to the admin so they know to book the test.

## Changes

### 1. Create Database Table: `test_slot_reservations`

A new table to store reservation requests from instructors:

- `id` (uuid, primary key)
- `instructor_id` (uuid, FK to instructors)
- `centre` (text) -- test centre name
- `date` (text) -- slot date
- `time` (text) -- slot time
- `status` (text, default 'pending') -- pending / booked / cancelled
- `created_at` (timestamptz)

RLS policies: instructors can insert and read their own reservations. Admins can read/update all.

### 2. Update `AvailableTestSlots` Component

- Pass `instructorId` as a prop (from the parent page)
- Add a "Reserve" button to each slot card
- On click: insert a row into `test_slot_reservations` and insert an admin notification into `admin_activity_log`
- Show a success toast confirming the reservation request was sent
- Disable the button after reserving (track reserved slot indices in local state)

### 3. Update `InstructorTestRequests` Page

- Pass `instructor?.id` to the `AvailableTestSlots` component

## Technical Details

### Database Migration

```sql
CREATE TABLE public.test_slot_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id),
  centre TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.test_slot_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can insert own reservations"
  ON public.test_slot_reservations FOR INSERT
  TO authenticated
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors can read own reservations"
  ON public.test_slot_reservations FOR SELECT
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Admins can manage all reservations"
  ON public.test_slot_reservations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
```

### Component Changes

Each slot card gets a "Reserve" button on the right side. When clicked, it:
1. Inserts a row into `test_slot_reservations`
2. Logs to `admin_activity_log` with action_type `'test_slot_reservation'` so admin sees it
3. Shows a success toast: "Reservation request sent to admin"
4. Disables the button and shows "Reserved" state

### Files Modified
- `src/components/test-requests/AvailableTestSlots.tsx` -- add Reserve button and reservation logic
- `src/pages/InstructorTestRequests.tsx` -- pass instructorId prop

### Files Created
- None (database table created via migration)

