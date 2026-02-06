

## Bespoke Booking Creator for Admin Portal

Add a "Create Bespoke Booking" button at the top of the admin overview page that opens a modal where you can manually create a custom course booking, assign it to an instructor, and take payment.

### What You'll Get

A prominent button at the top of the admin dashboard that opens a multi-step modal:

**Step 1 - Course Details:**
- Custom course title (free text, e.g. "30hr Intensive Course")
- Course length in hours
- Total course cost (GBP)
- Customer name, email, phone
- Optional notes

**Step 2 - Assign Instructor:**
- Dropdown of all active instructors (pulled from existing `instructors` table)
- Shows instructor name and area

**Step 3 - Take Payment:**
- Payment method selection: Card (online via your existing Cardstream/NPI gateway), Cash, Bank Transfer
- For card payments, triggers the existing `payment-intent-create` flow to process payment
- For cash/transfer, records the booking as manually paid

On completion, the booking is saved to `scheduled_lessons` and optionally a payment record is created in `payment_history`.

---

### Technical Details

**New Component:** `src/components/admin/BespokeBookingModal.tsx`
- Multi-step form dialog (Course Details -> Assign Instructor -> Payment)
- Fetches instructors from `instructors` table for the dropdown
- Uses zod validation for form inputs
- For card payments: calls `payment-intent-create` edge function, then renders the existing hosted fields flow
- For cash/bank transfer: directly records payment via `payment_history` insert

**Modified Files:**

1. **`src/pages/AdminPortal.tsx`** - Add state for the bespoke booking modal and a "Create Bespoke Booking" button at the top of the overview section (before `AdminSettingsGrid`)

2. **`src/components/admin/AdminSettingsGrid.tsx`** (optional) - Could alternatively place the button here in the quick actions area

**Database:** No schema changes needed. Uses existing tables:
- `scheduled_lessons` - stores the booking with custom `lesson_type` for the course title
- `payment_history` - records the payment
- `instructors` - populates the instructor dropdown
- `payment_intents` - used if card payment is selected

**No new edge functions needed** - reuses existing `payment-intent-create` for card payments.

