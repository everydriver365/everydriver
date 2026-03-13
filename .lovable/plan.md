

## Suggestions to Streamline the Booking Flow

After reviewing the current mobile booking flow, here are the key friction points and proposed improvements:

### Current Flow (7+ scrollable sections)
1. Header → Progress bar → Date banner → "Book in 60 seconds" badge → 5 accordion tiles (Summary, Instructor, Lessons, Prerequisites, What to Bring) → Details form → Scheduler → Payment

### Proposed Changes

**1. Collapse the accordion tiles into the header**
- Remove the separate Summary and Instructor accordion tiles. Instead, show the course image, name, hours, location, and instructor avatar/name directly in a compact header card (always visible, not expandable). This eliminates two taps and scroll distance.

**2. Remove the "Book in 60 seconds" banner**
- It adds visual clutter without functional value. The progress stepper already communicates speed.

**3. Hide Prerequisites and What to Bring behind a single "Course Info" link**
- Replace two separate accordion tiles with a single "View course details" text link that opens a bottom sheet/dialog. Most users don't need this during checkout.

**4. Auto-expand the current step, collapse completed steps**
- When details are filled, auto-collapse Step 1 into a summary line ("John Smith · john@example.com") with an "Edit" button. This keeps focus on the active step and reduces scroll.

**5. Sticky payment summary at the bottom**
- Add a sticky bottom bar showing the total price and a "Pay" CTA that scrolls to/activates the payment section. On mobile, users currently have to scroll past everything to reach payment.

### Technical Approach

- **`MobileBookingView.tsx`**: Restructure the JSX to merge the header card, remove the Zap banner, replace accordion tiles with a compact layout, and add auto-collapse logic for completed steps.
- **New component `BookingBottomBar.tsx`**: A sticky footer with price + primary CTA button.
- **`BookingSummary.tsx`**: Pass through any new props needed for the bottom bar.

### Summary of visual changes

```text
BEFORE                          AFTER
┌──────────────────┐           ┌──────────────────┐
│ Header           │           │ Header + Summary  │
│ Progress Steps   │           │ Progress Steps    │
│ Date Banner      │           │ Date Banner       │
│ ⚡ Book in 60s   │           ├──────────────────┤
│ ▸ Summary        │           │ Step 1: Details   │
│ ▸ Instructor     │           │  (auto-collapses) │
│ ▸ Choose Lessons │           │ Step 2: Schedule  │
│ ▸ Prerequisites  │           │ Step 3: Payment   │
│ ▸ What to Bring  │           ├──────────────────┤
├──────────────────┤           │ [Course info link]│
│ Step 1: Details  │           ├──────────────────┤
│ Step 2: Schedule │           │ ██ Sticky £400 ██ │
│ Step 3: Payment  │           └──────────────────┘
└──────────────────┘
```

This reduces the page from ~7 sections to ~4, cutting scroll distance roughly in half on mobile.

