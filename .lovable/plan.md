## Remove duplicate header on Drive365 pupil Payments screen

**Problem:** On `/p/:slug` Payments, two headers stack: the outer `PupilMobileHeader` (navy bar with back arrow + "Payments" title, rendered by `BrandedPupilPortal`) and the inner `PaymentsNav` (navy bar with back arrow + "Payments" + instructor name, rendered inside `PupilPortalPayments`).

**Fix:** Drop the inner `PaymentsNav` from `PupilPortalPayments` so the screen matches every other pupil sub-section (Schedule, Theory, etc.), which rely solely on the outer `PupilMobileHeader` for the back arrow and section title.

### Changes
- `src/components/pupil-portal/PupilPortalPayments.tsx`
  - Remove the `<PaymentsNav .../>` render and its import.
  - Remove the now-unused `handleBack`, `onBack` prop wiring, and `instructorName` / `instructorCentre` props from the component signature (props still passed by parent are harmless to leave, but cleaner to drop usage).
  - Keep `BalanceHero` as the first element under the outer header — the navy hero already visually continues the navy header for a seamless look.

### Out of scope
- No changes to `BrandedPupilPortal`, the outer header, or any other section.
- No changes to payment logic, search, history, Pay Now, or modals.