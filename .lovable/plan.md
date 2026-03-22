

## Plan: Limited Free Payments + Read-Only Income Summary

### What We're Building
1. **5 payments/month limit on the Free plan** — free users can record up to 5 payments per month. After that, they see an upgrade prompt.
2. **Read-only 30-day income summary for Free plan** — free users see a simplified last-30-days income view instead of the full gated page.

### Current State
- Payment routes (`/instructor/pay`, `/instructor/take-payment`, `/instructor/income`) are fully gated behind `payment_tracking` feature
- Free plan does NOT include `payment_tracking`
- The `FeatureGate` component shows an `UpgradePrompt` when the feature is missing

### Changes

#### 1. Remove hard gate on payment routes, add soft limit
**`src/routes/instructorPortalRoutes.tsx`**
- Remove `FeatureGate` wrapper from `/instructor/pay`, `/instructor/take-payment`, and `/instructor/income`
- These pages will handle their own gating internally

#### 2. New hook: `usePaymentLimit`
**`src/hooks/usePaymentLimit.ts`** (new)
- Queries `payment_history` count for the current month for the instructor
- Returns `{ count, limit: 5, isAtLimit, remaining }`
- Only applies when instructor's subscription lacks `payment_tracking` feature

#### 3. Update `TakePaymentModal` and `RecordPaymentModal`
- Import `usePaymentLimit`
- If `isAtLimit` is true, show an upgrade prompt instead of the payment form
- Show remaining count badge: "3 of 5 free payments used this month"

#### 4. Update `StepPayment` (end-of-lesson flow)
- Same limit check — if at limit, show upgrade prompt with skip option

#### 5. New page: `InstructorIncomeFreeSummary.tsx`
**`src/pages/InstructorIncomeFreeSummary.tsx`** (new)
- Read-only card showing last 30 days: total income, payment count, top payment method
- Blurred/teaser section showing "Full history, financial year totals, and export available on All-In"
- CTA button to upgrade

#### 6. Update `InstructorIncome` routing
**`src/pages/InstructorIncome.tsx`**
- At top of component, check if user has `payment_tracking` feature
- If not, render `InstructorIncomeFreeSummary` instead

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/usePaymentLimit.ts` | **New** — count monthly payments, enforce 5/mo limit |
| `src/pages/InstructorIncomeFreeSummary.tsx` | **New** — read-only 30-day income teaser |
| `src/routes/instructorPortalRoutes.tsx` | Remove FeatureGate from pay, take-payment, income routes |
| `src/components/instructor/TakePaymentModal.tsx` | Add limit check + remaining count |
| `src/components/instructor/RecordPaymentModal.tsx` | Add limit check + remaining count |
| `src/components/instructor/end-lesson/StepPayment.tsx` | Add limit check |
| `src/pages/InstructorIncome.tsx` | Render free summary when feature not available |

