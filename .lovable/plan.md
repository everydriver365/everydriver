

## Implement Tiered Service Fees (2% + 25p Free / 1.5% + 25p Paid)

### Overview

Set different service fee rates per subscription tier. Free-tier instructors pay **2% + 25p**, paid subscribers pay **1.5% + 25p**. The comparison page highlights this as a benefit of upgrading.

### Database Changes

1. **Update `platform_commission_config`** — Set the "payment" row to the free-tier default: `rate_percent = 2.0`, `fixed_fee_pence = 25`

2. **Update `subscription_plans`** — Set `commission_rate_percent` and `commission_fixed_pence` on each plan:
   - `free` → `2.0` / `25`
   - All paid plans (`all_in`, `gps_health`, `dashcam_health`, etc.) → `1.5` / `25`

3. **Add a row to `comparison_features`** in the "Payments & Billing" category:
   - Feature name: "Service fee on payments"
   - `plan_values`: `{ "free": "2% + 25p", "all_in": "1.5% + 25p", "gps_health": "1.5% + 25p", "dashcam_health": "1.5% + 25p" }`

### Code Changes

**`src/hooks/useAdminFee.ts`** — Update to accept an optional `instructorId` and auto-detect the tier:
- Query the instructor's active subscription → join to `subscription_plans` to get `commission_rate_percent` and `commission_fixed_pence`
- If the plan has custom rates, use those instead of the global `platform_commission_config`
- Falls back to global config if no subscription found (free tier default)

Alternative simpler approach: Add `instructorTier` parameter. Callers already fetch the instructor's subscription info — pass the plan's commission rates directly:
- New signature: `useAdminFee(baseAmount, commissionSplitPercent, tierConfig?)`
- Where `tierConfig` = `{ ratePercent, fixedFeePence }` from the instructor's subscription plan
- If not provided, falls back to global `platform_commission_config` (which is the free-tier rate)

**`src/pages/ComparisonPage.tsx`** — No code changes needed; the new "Service fee on payments" row will appear automatically from the database since features are data-driven.

### Files Modified
- `src/hooks/useAdminFee.ts` — tier-aware fee calculation
- `src/components/parent/ParentPaymentTopUp.tsx` — pass plan commission rates
- `src/components/instructor/TakePaymentModal.tsx` — pass plan commission rates
- `src/components/pupil-portal/PupilPaymentModal.tsx` — pass plan commission rates
- `src/components/pupil-portal/PupilPaymentDrawer.tsx` — pass plan commission rates
- Database: `platform_commission_config`, `subscription_plans`, `comparison_features` data updates

