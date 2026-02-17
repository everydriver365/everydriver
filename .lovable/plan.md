

# Add Payout Speed Options to Plan Cards

## Overview
Add a "Payout Speed" section to each plan card on the instructor plans comparison page, showing whether the plan includes "24 hours" or "Instant" payouts. This helps instructors understand how quickly they receive their money based on their subscription tier.

## What Will Change

A new column `payout_speed` will be added to the `subscription_plans` table to store the payout timing for each plan (e.g., "24 hours", "Instant"). This value will be displayed on each plan card, right below the existing "Card Payment Fees" section, with a clock icon and clear labelling.

**Suggested tier mapping:**
- **Free** -- 24 hours
- **Pro** -- 24 hours
- **Max** -- Instant
- **Multi** -- Instant
- **Enterprise** -- Instant

## How It Will Look

On each plan card, below the "Card Payment Fees" row, a new row will appear:

```text
[Clock icon] Payout Speed
24 hours          (for Free/Pro, shown in neutral text)
Instant           (for Max+, shown in green/bold as a perk)
```

## Technical Steps

1. **Database migration** -- Add a `payout_speed` text column to `subscription_plans` and populate it with default values per plan tier.

2. **Update `src/pages/InstructorPlans.tsx`** -- Add a "Payout Speed" section below the existing "Card Payment Fees" block. Import a `Clock` icon from lucide-react. Display the value from the new column, highlighting "Instant" in green.

3. **Update `src/pages/instructor-app/InstructorPricing.tsx`** (public pricing page) -- Add the same payout speed display to the public-facing plan cards for consistency.

4. **Update `src/pages/instructor-app/InstructorPlanDetail.tsx`** (plan detail page) -- Show payout speed as an additional metric card alongside Pupils and SMS.

5. **Update TypeScript interfaces** in each affected file to include the new `payout_speed` field.

