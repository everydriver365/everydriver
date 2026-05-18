## Scope

Drive365 mobile pupil site only (`BrandedPupilPortal` → `activeSection === 'payments'`). Pure visual redesign of `src/components/pupil-portal/PupilPortalPayments.tsx`. No API, navigation, payment, or balance logic changes.

## Files

**Edit**
- `src/components/pupil-portal/PupilPortalPayments.tsx` — replace render layer; keep `fetchPayments`, `PupilPaymentModal`, `getActivePaymentQrUrl`, share/copy handlers, props contract.
- `src/pages/BrandedPupilPortal.tsx` (payments block, lines ~518–536) — remove the outer `SubPageHeader` and the `px-4 pt-4` wrapper so the new screen owns its own navy nav + hero. Keep `PupilPaymentFeed` rendered above (instructor-side feed, unrelated to redesign) OR move it below the history card — confirm in question.

**Create** (web-adapted from the RN spec, plain `div`/Tailwind + inline styles, Poppins via existing font stack)
- `src/components/pupil-portal/payments/tokens.ts`
- `src/components/pupil-portal/payments/PaymentsNav.tsx`
- `src/components/pupil-portal/payments/BalanceHero.tsx`
- `src/components/pupil-portal/payments/PaymentsSearchRow.tsx`
- `src/components/pupil-portal/payments/PaymentsResultsBar.tsx`
- `src/components/pupil-portal/payments/PaymentsHistoryCard.tsx` (+ `PaymentsEmptyState`, `PaymentRow` co-located or split)
- `src/components/pupil-portal/payments/PayNowCard.tsx`

## Behaviour mapping

- **Balance**: use existing `accountBalance` prop. Spec sign convention is inverted vs current DB (spec: `balance > 0` = owed). Current code treats `balance < 0` as debt. I'll keep the **existing project convention** (`< 0` = owed, `> 0` = credit, `0` = balanced) and map labels accordingly so live data stays correct. Pill colours follow the spec's three states.
- **Payments list**: `payment_history` rows are all completed → status `'paid'`. `description` = `notes || "Lesson payment"`, `dateFormatted` = `format(recorded_at, 'EEE d MMM yyyy')`.
- **Search**: client-side filter on description (case-insensitive).
- **Export CSV**: generate from filtered rows client-side (Blob + `<a download>`); no new endpoint.
- **Filter button**: no existing `PaymentsFilter` route — render as inert placeholder (toast "Filters coming soon") to avoid dead nav.
- **Voice mic**: no existing voice handler — render as inert (focuses input) to keep visual parity.
- **Pay Now**: opens `paymentLinkBaseUrl || activePaymentUrl` in new tab (existing behaviour). If neither URL exists, fall back to opening `PupilPaymentModal` (existing flow).
- **Share**: keeps existing `navigator.share` / clipboard fallback + toast.
- **Prepaid hours**: spec omits this. Keep it as a compact line under the balance pill to avoid losing live info, unless you want it dropped.

## Notes

- Route `/p/:slug` already renders the mobile pupil portal; no routing changes.
- No new libraries. Icons from `lucide-react` (already used). `format` from `date-fns` (already used).
- Will not touch `PupilPaymentFeed`, `PupilPaymentModal`, or any other payment component.

## Open questions

1. Keep `PupilPaymentFeed` above the new nav (current behaviour) or remove it from the payments section entirely so the redesign is the only thing on screen?
2. Keep the "prepaid hours remaining" line (live data) or drop it to match the spec exactly?
