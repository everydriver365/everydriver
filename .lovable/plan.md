

## Additional Zenbooker-Inspired Features

After auditing your app against the full Zenbooker feature set, here's what you already have and the remaining gaps worth closing.

### Already Covered
Invoicing, coupon codes, feedback/reviews, job status pipeline (en route/started/complete), "on my way" ETA texts, recurring bookings, online cancelling/rescheduling with notice periods, embeddable booking widget, buffer minutes between lessons, mobile app for instructors, customer (pupil) history, broadcast messaging, and custom branding.

### Features Still Missing

**1. Drive-Time-Aware Scheduling**
Zenbooker's newest feature: when calculating available booking slots, factor in travel time between jobs based on postcodes. Your app has `buffer_minutes` but it's a flat value — it doesn't vary by how far apart two pupils live. This would prevent instructors from accidentally booking back-to-back lessons across town.
- When checking slot availability, calculate drive time from the previous/next lesson's pickup postcode using the HERE or Google Directions API
- Block slots where the instructor can't realistically arrive in time
- Show a warning badge on the diary if two adjacent lessons have tight travel

**2. Bookable Estimates / Quotes**
Zenbooker lets businesses send a custom quote that the customer can review and click to book. Adapted for driving instruction: when a new enquiry comes in, the instructor sends a personalised quote (package, price, schedule suggestion) that the pupil/parent can accept with one tap, which auto-creates the pupil record and first lesson.
- New `quotes` table (instructor_id, pupil_name, email, phone, package details, price, status, expires_at)
- "Send Quote" action on the Enquiries page
- Branded quote page the recipient opens via a link, with "Accept & Book" button
- On acceptance, auto-creates pupil + first scheduled lesson

**3. Intake Questions on Booking**
Zenbooker collects custom fields during booking. For driving instructors, this means capturing key info upfront when a pupil books: provisional licence status, previous lessons count, any special requirements, preferred areas, manual/automatic preference.
- New `booking_intake_questions` table (instructor_id, question_text, field_type, options, display_order, required)
- Instructor configures questions in Settings
- Questions appear on the public booking form and pupil self-booking flow
- Answers stored on the enquiry/pupil record and visible on the pupil card

**4. Price Adjustment Rules**
Zenbooker adjusts pricing based on location, time of day, day of week, and advance notice. Your app has a flat hourly rate. Adding rules would let instructors charge more for evenings/weekends, areas further from base, or last-minute bookings.
- New `pricing_rules` table (instructor_id, rule_type [time_of_day, day_of_week, postcode_zone, advance_notice], condition, adjustment_type [flat, percent], adjustment_value)
- Applied automatically when calculating lesson cost in booking flows and invoices
- Settings UI to create/edit rules

**5. Invoice Payment Links**
Your app has invoicing, but no way for the pupil to pay an invoice online. Zenbooker includes a secure payment link in every invoice. Adding a "Pay Now" link (via your existing Square/Stripe integration) that opens a branded payment page would close the loop.
- Generate a unique token per invoice
- Public `/pay/:token` page showing invoice details + payment form
- On payment, auto-mark invoice as paid and update pupil balance

**6. Cancellation Feedback Analytics**
You already collect `cancellation_reason` text, but don't surface it anywhere. Zenbooker shows cancellation analytics. Adding a simple dashboard widget showing cancellation trends, common reasons, and rates would help instructors identify patterns.
- New widget on the Analytics/Reports page
- Aggregate cancellation reasons into categories (auto-classify or preset dropdown)
- Show cancel rate trend over time

### Recommended Build Order
1. Drive-Time-Aware Scheduling (biggest operational impact — prevents overbooking)
2. Bookable Estimates/Quotes (improves enquiry conversion)
3. Intake Questions (captures info upfront, saves time)
4. Invoice Payment Links (closes the payment loop)
5. Price Adjustment Rules (revenue optimization)
6. Cancellation Feedback Analytics (insight, quick win)

### Files & DB Changes Summary

| Feature | New Tables | New Components | Modified Files |
|---------|-----------|----------------|----------------|
| Drive-Time Scheduling | None (uses existing APIs) | `TravelTimeWarning.tsx` | Availability/gap logic, diary view |
| Bookable Quotes | `quotes` | `SendQuoteSheet.tsx`, `QuoteAcceptPage.tsx` | Enquiries page |
| Intake Questions | `booking_intake_questions`, `booking_intake_answers` | `IntakeQuestionsSettings.tsx`, `IntakeQuestionsForm.tsx` | Booking forms, pupil card |
| Invoice Payment Links | None (add token column to `invoices`) | `PublicInvoicePay.tsx` | Invoice generation, router |
| Price Adjustment Rules | `pricing_rules` | `PricingRulesSettings.tsx` | Lesson cost calculation |
| Cancel Analytics | None | `CancellationAnalytics.tsx` | Analytics page |

