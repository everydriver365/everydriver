# What the "card details" section is

At the bottom of the booking flow, the **CoursePaymentBlock** renders a list of payment-method tiles (Card / Klarna / Clearpay / Bank / Cash). The "Card" tile is the section you're seeing — it's the entry point for paying by Visa / Mastercard / Amex.

# Is it wired in?

**On mobile** (`MobileBookingView`): Yes. Tapping "Pay by Card" calls `ryft-create-checkout` and redirects to the Ryft hosted page. ✅

**On desktop** (`src/pages/BookingSummary.tsx` and `src/pages/everydriver/BookingSummary.tsx`): **No — it's broken.** The Card tile's handler is `handleElavonCheckout`, which only sets a `showHostedFields` flag. That flag is then passed into `MobileBookingView` (which never renders on desktop) and into a deleted Square embedded checkout — so on desktop the button does nothing.

There are also dozens of lingering Square references (state, handlers, props, gateway-health checks, query-param keys, the Square card logo image, stale comments) even though the Square card form itself was removed earlier.

# Plan

## 1. Make the desktop Card tile actually pay (via Ryft)

In both `src/pages/BookingSummary.tsx` and `src/pages/everydriver/BookingSummary.tsx`:

- Replace `handleElavonCheckout` with a new `handleCardCheckout` that:
  - Validates pupil details + schedule (same gate as today).
  - Calls `ensureBookingCreated(paymentOption === 'deposit' ? 'deposit' : 'full', amount)` to create the pending booking.
  - Invokes `supabase.functions.invoke("ryft-create-checkout", { … serviceFeePence, returnUrl `…?ryft=success`, cancelUrl `…?ryft=cancelled` })`.
  - Redirects via `window.location.href = data.url`.
  - Mirrors the implementation already used in `MobileBookingView` and `PupilPaymentModal`.
- Pass `handleCardCheckout` to `CoursePaymentBlock` as `onCardCheckout` (replacing the dead Elavon handler).

## 2. Remove dead "hosted fields" / embedded Square plumbing

- Delete `showHostedFields` state, the auto-`setShowHostedFields(true)` effect, and every `setShowHostedFields(true)` call site.
- Remove `showEmbeddedCheckout`, `embeddedCheckoutPupilId`, `onEmbeddedCheckoutSuccess`, `onEmbeddedCheckoutCancel` props on the `MobileBookingView` render and from `MobileBookingView`'s prop type. The mobile flow already does its own Ryft redirect.

## 3. Remove every remaining Square reference (booking surfaces)

Files: `src/pages/BookingSummary.tsx`, `src/pages/everydriver/BookingSummary.tsx`, `src/components/booking/MobileBookingView.tsx`, `src/components/booking/CoursePaymentBlock.tsx`.

- Drop `isSquareLoading`, `handleSquareCheckout`, `squareAvailable` prop on `CoursePaymentBlock` (and the `disabledExtra: !squareAvailable` gate — replace with `false` since Ryft availability is assumed).
- Drop `square` from the `gatewayHealth` type/initialiser and from the `cancelKeys` array used to clear stale query params (keep `gocardless`, `clearpay`, `npi`, add `ryft`).
- Drop `onNPICheckout={handleElavonCheckout}` plumbing (legacy alias).
- Replace `squareCardsLogo` (`@/assets/square-cards-3.jpg`) usages with a neutral "Visa · Mastercard · Amex" text row, or with an existing card-network logo asset if available. Remove the import. (We will not delete the asset file itself in this pass.)
- Rewrite stale comments (`// SquarePaymentForm import removed`, `{/* Square card form removed */}`, etc.) — just delete them.
- Rename `?square=success` / `?square=cancelled` return/cancel URL params to `?ryft=...` everywhere they remain.

## 4. Out of scope (intentionally untouched)

- `src/pages/instructor/SquareInvoicesPage.tsx` and the `square-invoice-manage` / `square-webhook` edge functions — these are historic invoice/settlement views, not card processors. Per existing memory they stay.
- All `MessageSquare`, `Iconn`, etc. lucide-icon names — unrelated to Square payments.
- Ryft edge functions and `pupil-payment-checkout` (already migrated).

## Technical notes

- The new `handleCardCheckout` payload mirrors `PupilPaymentModal` / `MobileBookingView`:
  ```ts
  await supabase.functions.invoke("ryft-create-checkout", {
    body: {
      instructorId: instructor.id,
      pupilId,
      amountPence: Math.round(amount * 100),
      serviceFeePence: Math.round(effectiveAdminFee * 100),
      description: `${courseName} - ${hours}h`,
      returnUrl: `${origin}/booking-confirmation?pupilId=${pupilId}&ryft=success`,
      cancelUrl: `${origin}/book/${instructor.id}?hours=${hours}&ryft=cancelled`,
    },
  });
  ```
- After the edit, the only card processor reachable from any booking surface is Ryft. Square remains only in the (separate) historic invoice page.
