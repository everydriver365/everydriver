

## Redesign the "Pay" Button Modal — Three Clear Options

### Current Behaviour
Clicking "Pay" in the header opens a `TakePaymentSheet` (bottom sheet) with a cluttered list: Show QR, Send Payment Link, Record Manual Payment, Share Payment Link, Email Receipt. It's confusing and mixes different use cases together.

### New Behaviour
Replace the bottom sheet with a clean modal that presents **three primary options** as large tappable cards:

1. **QR Code** — Displays the instructor's payment QR code (using the correct one based on `commission_payer` setting via `getActivePaymentQrUrl`). This is the existing `PaymentQRModal` content, shown inline within the modal when selected.

2. **Card Entry** — Shows the Elavon Hosted Fields (the `CardstreamCheckout` component) inline, allowing the instructor to manually key in card details and charge the pupil. The admin fee is automatically applied or absorbed based on the instructor's `commission_payer` profile setting. The instructor first selects a pupil and enters an amount, then the card fields appear.

3. **Send Link** — Allows the instructor to send a payment link to a pupil via SMS, email, or both (selectable via checkboxes). The link is the `/pay/{instructorId}?pupil={pupilId}` URL. Uses the existing `send-payment-reminder` edge function for SMS, and will need a new email variant or an update to the existing function to also support email delivery.

### UI Flow
- Tapping "Pay" opens a `Dialog` (not a bottom sheet) with the three options as icon cards in a row/grid.
- Tapping an option transitions the modal content to show that option's UI (with a back arrow to return to the three-option picker).
- The modal stays open throughout — no separate modals opening/closing.

### Files to Change

**1. New file: `src/components/instructor/TakePaymentModal.tsx`**
- New component replacing `TakePaymentSheet` usage from the header.
- Contains the three-option picker and sub-views for each option.
- **QR Code view**: Renders the QR image from `getActivePaymentQrUrl(instructor)` (same as current `PaymentQRModal`).
- **Card Entry view**: Pupil selector dropdown + amount input + `CardstreamCheckout` component. Calculates admin fee based on `commission_payer` using the platform commission config (2.5% + 20p). Needs `payment-intent-create` to get the `merchantIdForHPF`.
- **Send Link view**: Pupil selector + radio/checkboxes for SMS/Email/Both + Send button. Constructs the `/pay/{instructorId}?pupil={pupilId}` link and invokes the `send-payment-reminder` function.

**2. `src/components/instructor/InstructorMobileHeader.tsx`**
- Replace `TakePaymentSheet` with the new `TakePaymentModal`.
- Remove `PaymentQRModal` usage (now embedded in the new modal).
- Clean up unused state (`qrOpen`, `paymentSheetOpen`, `recordPaymentOpen`).

**3. `src/components/instructor/HomeQuickActions.tsx`**
- Update the "Take Payment" action's `onTakePayment` to open the new modal (no change needed if the parent already passes the handler).

**4. `supabase/functions/send-payment-reminder/index.ts`**
- Extend to support email delivery alongside SMS. Add a `method` field (`sms`, `email`, `both`) to the request body. When `email` is selected, send the payment link via the existing email infrastructure (Resend or Twilio SendGrid). The email body will include the payment link URL.

### Admin Fee Logic for Card Entry
- Fetch `commission_payer` from the instructor's profile (already available in `useInstructorAuth`).
- If `commission_payer === 'pupil'`: add 2.5% + 20p to the entered amount and show the breakdown before charging.
- If `commission_payer === 'instructor'`: charge the entered amount as-is (commission deducted from instructor's payout).
- Fetch the live commission config from `platform_commission_config` table to get the exact rate.

### Payment Link for Send Link
- Construct: `${window.location.origin}/pay/${instructorId}?pupil=${pupilId}`
- The `/pay/:instructorId` page already handles pupil pre-fill and auto-reconciliation per the existing portal setup.

