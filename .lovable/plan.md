

## Better Mobile Payment Solutions — Analysis and Recommendations

### Current State

The mobile payment experience has two paths:

1. **Pupil Portal** (`PupilPaymentModal`): Shows Square Apple Pay/Google Pay buttons + 4 gateway cards (NPI, Clearpay, Klarna, Elavon) in a dialog modal. The modal is cramped on a 390px viewport with too many options visible at once.

2. **Booking Flow** (`CardstreamPayButton`): Simple HPP redirect button — works well on mobile.

### Problem

The pupil payment modal tries to show everything at once: amount input, quick-amount buttons, wallet buttons (loading Square SDK), and 4 gateway cards. On a 390px screen this requires significant scrolling and feels overwhelming. The Square wallet buttons also load a third-party SDK which can be slow on mobile connections.

### Recommended Improvement: Streamlined Mobile Payment Sheet

Restructure the `PupilPaymentModal` into a mobile-optimised bottom sheet (using `vaul` Drawer, already installed) with a staged flow:

**Stage 1 — Amount Selection**
- Large, clear amount display with the balance owed
- Quick-select chips (Full Balance, £50, £100) 
- "Continue" button

**Stage 2 — Payment Method**
- Apple Pay / Google Pay at top (express checkout — most convenient on mobile)
- "Pay by Card" single primary button (Cardstream HPP — reliable, no SDK)
- Expandable "More options" for Klarna/Clearpay (BNPL)
- Remove redundant "Elavon" option (it's a duplicate card gateway)

This reduces cognitive load, prioritises the fastest mobile payment method (wallet pay), and uses a Drawer instead of Dialog for better mobile UX.

### Changes

**1. Create `src/components/pupil-portal/PupilPaymentDrawer.tsx`**
- Uses `vaul` Drawer component (already installed) instead of Dialog
- Two-stage flow: amount → payment method
- Apple Pay / Google Pay prominent at top of stage 2
- Single "Pay by Card" button using Cardstream HPP redirect (no SDK overhead)
- Collapsible BNPL section for Klarna/Clearpay

**2. Update `src/components/pupil-portal/PupilPaymentModal.tsx`**
- On mobile viewports (< 640px), render the new `PupilPaymentDrawer` instead of the Dialog
- Desktop keeps the existing Dialog layout

**3. Simplify gateway list**
- Remove "Elavon" as a separate option (redundant with NPI/Cardstream)
- Keep: Card (Cardstream HPP), Klarna, Clearpay as the three explicit options
- Apple Pay / Google Pay via Square SDK shown separately as express checkout

No backend or database changes needed.

