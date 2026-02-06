

## Revamp Bespoke Booking Form

### Changes Overview

Update the bespoke booking modal to collect full pupil details, remove the card payment trigger, and add the option to send the booking as a Job Offer instead of assigning a specific instructor.

---

### Step 1: Add Missing Columns

**Database migration** to add fields that `course_enquiries` currently lacks:

- `email` (text, nullable) on `course_enquiries`
- `phone` (text, nullable) on `course_enquiries`
- `transmission_type` (text, nullable) on `course_enquiries` -- values: 'manual' or 'automatic'
- `total_cost` (numeric, nullable) on `course_enquiries`
- `transmission_type` (text, nullable) on `pupils` -- values: 'manual' or 'automatic'

---

### Step 2: Revamp the Form (BespokeBookingModal.tsx)

**Step 1 of the wizard -- Pupil and Course Details:**

Add these fields to the form schema and UI:

- Customer name (existing)
- Full address (text input, required)
- Postcode (separate field, required)
- Email (existing, make more prominent)
- Phone (existing, make more prominent)
- Transmission type: Manual / Automatic (radio group or select)
- Course title (existing)
- Course hours (existing)
- Total cost (existing)
- Notes (existing)

**Step 2 -- Assign Instructor OR Send as Job Offer:**

Replace the current "must pick an instructor" step with a choice:

- **Option A: Assign to a specific instructor** -- dropdown as it works now
- **Option B: Send as Job Offer** -- creates a `course_enquiries` record with status `pending`, which gets picked up by the existing Job Offers system and pushed to instructors covering that postcode

Remove the requirement that an instructor must be selected.

**Step 3 -- Confirm (no card payment):**

- Remove the Card payment option entirely
- Keep Cash and Bank Transfer as payment recording options
- Add a "Not yet paid" option for when payment hasn't been taken
- Show a summary and confirm

---

### Step 3: Update Submit Logic

**If instructor is assigned:**
1. Create pupil record with full address, postcode, transmission type
2. Create scheduled lesson
3. Optionally record payment (cash/bank transfer) or leave as unpaid

**If sent as Job Offer:**
1. Insert into `course_enquiries` with name, address, postcode, email, phone, course_type (title), requested_hours, total_cost, transmission_type, status = 'pending'
2. No pupil record created yet (that happens when an instructor accepts the job via the existing flow)
3. Optionally trigger the `assign-job` edge function to send push notifications to nearby instructors

---

### Technical Details

**Files modified:**
- `src/components/admin/BespokeBookingModal.tsx` -- complete revamp of form fields, assignment logic, and submit handler

**Database migration:**
- ALTER TABLE `course_enquiries` ADD COLUMN `email` text, `phone` text, `transmission_type` text, `total_cost` numeric
- ALTER TABLE `pupils` ADD COLUMN `transmission_type` text

