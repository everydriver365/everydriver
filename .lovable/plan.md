## Add "Enquiry Only" booking mode

A new fourth option alongside Pupil Choice / Auto-Assign / Instructor Assigns. When enabled, the public booking flow turns into a lightweight lead-capture form: name, email, phone, course interest, optional message. No payment, no slot picking. Instructor gets a notification and a row in a leads table to action.

### 1. Settings UI (mobile + desktop portal)

`src/components/instructor/BookingModeSelector.tsx` — add a fourth radio card:

- Icon: `Mail` (lucide), in `text-portal-accent` (#2B7BC8)
- Label: **Enquiry Only**
- Description: "Pupils submit an enquiry — no payment or slot booked. You contact them to arrange lessons."
- Value: `enquiry_only`

Used by both mobile (`InstructorMenu.tsx`) and desktop portal (already routes to the same selector). No mobile-specific layout changes needed beyond the new card — it stacks naturally.

### 2. Database

New migration:

```
ALTER TABLE public.instructors
  -- no column change required; booking_mode is text
  ;

CREATE TABLE public.booking_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  pupil_name text NOT NULL,
  pupil_email text NOT NULL,
  pupil_phone text NOT NULL,
  pupil_postcode text,
  course_name text,
  course_hours numeric,
  message text,
  status text NOT NULL DEFAULT 'new',  -- new | contacted | converted | dismissed
  source text DEFAULT 'mini_website',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  contacted_at timestamptz,
  converted_pupil_id uuid REFERENCES public.pupils(id) ON DELETE SET NULL
);

ALTER TABLE public.booking_enquiries ENABLE ROW LEVEL SECURITY;

-- Public can insert (anonymous booking enquiry)
CREATE POLICY "Anyone can submit an enquiry"
ON public.booking_enquiries FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Instructor can read/update their own
CREATE POLICY "Instructor can view own enquiries"
ON public.booking_enquiries FOR SELECT TO authenticated
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructor can update own enquiries"
ON public.booking_enquiries FOR UPDATE TO authenticated
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE TRIGGER trg_booking_enquiries_updated
  BEFORE UPDATE ON public.booking_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_booking_enquiries_instructor_status
  ON public.booking_enquiries(instructor_id, status, created_at DESC);
```

`booking_mode` stays `text`, so storing the new `'enquiry_only'` value needs no schema change. `InstructorForm.tsx` zod enum and `InstructorAuthContext` typings get extended to include it.

### 3. Public booking flow

In both `src/components/booking/MobileBookingView.tsx` and `src/pages/BookingSummary.tsx` add a branch when `booking_mode === 'enquiry_only'`:

- Hide payment, deposit, slot picker, scheduling sections.
- Show a single "Send enquiry" CTA after pupil details + optional `message` textarea.
- On submit: insert into `booking_enquiries` (no `create-booking` edge function call, no Square hosted fields) and show a confirmation screen ("Thanks — {instructor.name} will be in touch within 24 hours").
- Header price stays visible as a guide ("from £X") but no charge.

### 4. Instructor inbox

Add a small **Enquiries** card on the desktop dashboard and a new menu entry (mobile + desktop) at `/instructor/enquiries`:

- Lists rows from `booking_enquiries` ordered newest first.
- Status pill (New / Contacted / Converted / Dismissed).
- Quick actions: Call, Text, Email (mailto), Mark contacted, Convert → opens existing `AddPupilDialog` pre-filled with the enquiry's name/email/phone/postcode and on save updates `status='converted'` + `converted_pupil_id`.
- Realtime via existing `useRealtimeHub` (subscribe to `booking_enquiries` filtered by instructor_id).

### 5. Notifications

When a row is inserted, fire a notification via the existing notification edge function: WhatsApp (if `whatsapp_enabled`) or SMS (Twilio) + email to the instructor with the enquiry details and a one-tap deep link to `/instructor/enquiries`.

Implemented as a Postgres trigger calling an edge function `notify-booking-enquiry` (new), which respects the instructor's existing notification preferences. No new secrets required (Twilio/WhatsApp/Resend already configured).

### 6. Admin overview

`src/components/admin/BookingModeOverview.tsx` — add `enquiry_only` to the mode counts/filters/select dropdowns alongside the existing three.

### Files touched

- `src/components/instructor/BookingModeSelector.tsx` (new option)
- `src/components/admin/InstructorForm.tsx` (zod enum)
- `src/components/admin/BookingModeOverview.tsx` (counts + dropdown)
- `src/context/InstructorAuthContext.tsx` (typing comment)
- `src/components/booking/MobileBookingView.tsx` (enquiry branch)
- `src/pages/BookingSummary.tsx` (enquiry branch — desktop)
- `src/pages/InstructorEnquiries.tsx` (NEW inbox page)
- `src/components/instructor/EnquiryListItem.tsx` (NEW)
- Route registration in `src/App.tsx` + nav entry in instructor menu
- Migration: `booking_enquiries` table + RLS + trigger
- New edge function `supabase/functions/notify-booking-enquiry/index.ts`

No mobile layout rewrites — only the new menu row and the new enquiry inbox page (which uses the existing portal list patterns).
