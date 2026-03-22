

## Plan: No-Brainer Features + Marketing Formula

### What the user asked for
Items 1, 2, 3, 5, 6 from the previous feature list, payments via payment link/QR code only (no Stripe), and a "no-brainer formula" section on the marketing page.

### Feature Breakdown

**1. Auto Mileage Tax Calculator Dashboard**
The mileage tracker already exists (`InstructorMileageTracker.tsx`) with HMRC 45p/25p rates. What's missing is a prominent, always-visible "Tax Savings" summary card on the instructor dashboard showing real-time HMRC deduction amounts.

- New component: `src/components/instructor/dashboard/MileageTaxSavingsCard.tsx`
- Queries `mileage_logs` for current tax year, calculates HMRC allowance (45p first 10k miles, 25p thereafter)
- Shows: total business miles, tax deduction value, projected annual savings
- Add to `InstructorPortal.tsx` dashboard layout

**2. Branded Pupil Portal (PWA-ready)**
`PupilPortal.tsx` already exists with lesson info, progress, and coaching. Enhancement:

- New component: `src/components/pupil-portal/PupilInstallPrompt.tsx` — PWA install banner ("Add to Home Screen")
- Update `PupilPortal.tsx` to show instructor branding (logo, colours, name) more prominently
- Add self-service rescheduling button (ties into item 3)

**3. Self-Service Rescheduling**
Allow pupils to request a reschedule from the Pupil Portal within instructor-defined rules.

- New DB table: `reschedule_requests` (pupil_id, lesson_id, instructor_id, requested_date, requested_time, status, reason)
- New component: `src/components/pupil-portal/RescheduleRequestForm.tsx` — pupil selects available slot, provides reason
- Instructor gets notification and can approve/reject from their diary
- Rule: only allowed 48h+ before lesson (configurable)

**5. Test Readiness Score**
A data-driven score based on lessons completed, topics covered, and mock test results.

- New component: `src/components/instructor/TestReadinessScore.tsx`
- Calculates score from: lessons completed vs recommended (typically 40-50), topic coverage from lesson notes, test results
- Visual gauge/progress ring with "Not Ready / Getting There / Test Ready" labels
- Show on pupil detail page and pupil portal

**6. Instant Pay Collection (Already Exists — Confirm + Enhance)**
`PaymentLinkShare.tsx` already generates payment links with QR codes. `TakePaymentModal.tsx` already uses it. The end-of-lesson flow (`StepPayment.tsx`) already has QR display. This is confirmed working — no Stripe involved, uses GoCardless/direct recording.

Enhancement: Add a "Send Payment Link" button to the end-of-lesson `StepPayment` that shares the link via SMS/WhatsApp to the pupil.

**Marketing: No-Brainer Formula Section**
Add a new section to `HomepageRedesignDemo.tsx` between the testimonials and final CTA:

```text
┌─────────────────────────────────────────────┐
│  THE NO-BRAINER FORMULA                     │
│                                             │
│  ✓ Free diary & scheduling (£0)             │
│  ✓ Auto mileage = £2,250 tax savings/yr     │
│  ✓ HMRC MTD filing included (others: £144)  │
│  ✓ Pupil app with self-service booking      │
│  ✓ GPS tracking from £17/mo                 │
│  ✓ No lock-in, cancel anytime               │
│                                             │
│  "Save more in tax deductions than the      │
│   app costs. It literally pays for itself."  │
│                                             │
│  [Start Free Today]                         │
└─────────────────────────────────────────────┘
```

Also add to `SwitchToEveryDriver.tsx` as a new section.

### Database Changes

One migration:
```sql
CREATE TABLE public.reschedule_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pupil_id uuid REFERENCES public.pupils(id) ON DELETE CASCADE NOT NULL,
  lesson_id uuid NOT NULL,
  instructor_id uuid REFERENCES public.instructors(id) ON DELETE CASCADE NOT NULL,
  requested_date date NOT NULL,
  requested_time time,
  original_date date,
  original_time time,
  reason text,
  status text DEFAULT 'pending', -- pending, approved, rejected
  created_at timestamptz DEFAULT now(),
  responded_at timestamptz
);
ALTER TABLE reschedule_requests ENABLE ROW LEVEL SECURITY;
```

### Files Changed

| File | Change |
|------|--------|
| Database migration | Create `reschedule_requests` table + RLS |
| `src/components/instructor/dashboard/MileageTaxSavingsCard.tsx` | **New** — tax savings summary card |
| `src/pages/InstructorPortal.tsx` | Add MileageTaxSavingsCard to dashboard |
| `src/components/pupil-portal/PupilInstallPrompt.tsx` | **New** — PWA install banner |
| `src/components/pupil-portal/RescheduleRequestForm.tsx` | **New** — pupil reschedule request UI |
| `src/pages/PupilPortal.tsx` | Add install prompt + reschedule button + enhanced branding |
| `src/components/instructor/TestReadinessScore.tsx` | **New** — readiness gauge component |
| `src/components/instructor/end-lesson/StepPayment.tsx` | Add "Send Payment Link" SMS/WhatsApp button |
| `src/pages/HomepageRedesignDemo.tsx` | Add "No-Brainer Formula" marketing section |
| `src/pages/SwitchToEveryDriver.tsx` | Add "No-Brainer Formula" section + update feature comparison |

