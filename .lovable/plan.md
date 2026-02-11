

# Pupil Onboarding Welcome Email

## Overview

When a pupil books their first lesson or course through the mini-website booking flow, automatically send a comprehensive welcome/onboarding email containing all the information they need to get started: instructor details, vehicle info, payment options, and portal access links.

## How It Works

The `create-booking` edge function already handles booking creation and sends notifications. We will add a new edge function `send-pupil-welcome` that is called from `create-booking` after a successful booking. This keeps the logic modular and the welcome email self-contained.

## New Edge Function: `send-pupil-welcome`

### Input

```text
{
  pupilId, pupilName, pupilEmail, pupilPhone,
  instructorId, courseType, courseHours,
  firstLessonDate, firstLessonTime
}
```

### What It Does

1. Fetches instructor details from the `instructors` table: name, phone, email, vehicle type, transmission, slug, profile image, payment QR URLs, commission_payer
2. Builds a branded HTML email containing:
   - **Welcome header** with instructor name and profile photo
   - **Instructor contact info**: name, phone number, email
   - **Vehicle details**: vehicle type and transmission (manual/automatic)
   - **First lesson reminder**: date, time, pickup location
   - **Payment section**: QR code image (using the correct QR based on commission_payer setting), plus a payment link to the branded pupil portal
   - **Portal access links**:
     - Pupil Portal login: `https://everydriver.lovable.app/pupil/login`
     - Branded Pupil Portal: `https://everydriver.lovable.app/p/{slug}`
     - Parent Portal: `https://everydriver.lovable.app/parent`
   - **Instructor mini-website link**: `https://everydriver.lovable.app/i/{slug}`
   - **Helpful tips**: bring provisional licence, wear comfortable shoes, be ready 5 minutes early
3. Sends via Resend (RESEND_API_KEY already configured)

### Email Template Structure

```text
+-----------------------------------------------+
| Welcome to Your Driving Journey!               |
+-----------------------------------------------+
| Hi {pupilName},                                |
|                                                |
| Your instructor: {instructorName}              |
| Phone: {phone}                                 |
| Vehicle: {vehicleType} ({transmission})        |
|                                                |
| Your first lesson:                             |
| {date} at {time}                               |
+-----------------------------------------------+
| Payment Options                                |
| [QR Code Image]                                |
| Scan to pay or use the link below              |
| [Pay Online Button -> /p/{slug}]               |
+-----------------------------------------------+
| Your Portals                                   |
| [Pupil Portal] - Track progress, view lessons  |
| [Parent Portal] - For parents/guardians        |
| [Instructor Website] - Services and info       |
+-----------------------------------------------+
| Tips for your first lesson...                  |
+-----------------------------------------------+
```

## Changes to `create-booking`

Add a step 8 (after calendar sync) that calls the new `send-pupil-welcome` edge function, passing the pupil and instructor details. This is a non-fatal call (wrapped in try/catch) so booking success is not affected if the email fails.

## Technical Details

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/send-pupil-welcome/index.ts` | Welcome email edge function using Resend |

### Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/create-booking/index.ts` | Add step 8 to call `send-pupil-welcome` after booking is confirmed |

### Key Data Sources

- Instructor name, phone, vehicle info, slug: `instructors` table
- Payment QR URL: resolved using `commission_payer` logic (same as `getActivePaymentQrUrl`)
- Published site URL: `https://everydriver.lovable.app`
- Pupil portal: `/pupil/login` and `/p/{slug}`
- Parent portal: `/parent`
- Mini-website: `/i/{slug}`

### No Database Changes Required

All data needed is already available in the `instructors` and `pupils` tables. The Resend API key is already configured as a secret.

