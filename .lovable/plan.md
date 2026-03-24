

## Add Annual Pricing Toggle (10% Discount)

### Annual Prices (10% off monthly × 12)
| Plan | Monthly | Annual Total | Monthly Equiv. | Savings |
|------|---------|-------------|----------------|---------|
| Free | £0 | £0 | £0 | — |
| All-In | £7.99 | £86.29 | £7.19 | £9.59 |
| GPS + Health | £34.99 | £377.89 | £31.49 | £41.99 |
| Dashcam + Health | £54.99 | £593.89 | £49.49 | £65.99 |

### Database
1. **Add `price_annual` column** to `comparison_plans` — nullable text field.
2. **Populate values** — `£86.29` for All-In, `£377.89` for GPS+Health, `£593.89` for Dashcam+Health.

### Frontend Changes

1. **`src/hooks/useComparisonData.ts`** — add `price_annual: string | null` to `ComparisonPlan` interface.

2. **`src/pages/ComparisonPage.tsx`**:
   - Add a Monthly/Annual toggle below the hero with a "Save 10%" badge.
   - When Annual is selected, swap `plan.price` for `plan.price_annual` and show `/yr` period.
   - Show small "Save £X" text under annual prices.
   - Pass `&billing=annual` to CTA URLs when annual is active.
   - Apply to both desktop table header and mobile card views.

### Files Modified
- `supabase/migrations/` — new migration for `price_annual` column
- `src/hooks/useComparisonData.ts`
- `src/pages/ComparisonPage.tsx`

