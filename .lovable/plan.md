

# Pricing Page Trust Badges

## Overview

Add prominent trust signals to the pricing page: a "30-day money-back guarantee" badge on all paid plan cards, plus a central banner stating "Cancel anytime, no tie-in."

## Changes

### File: `src/pages/instructor-app/InstructorPricing.tsx`

1. **Add a badge on each paid plan card** (where `plan.price_monthly > 0`): a small green Badge reading "30-day money-back guarantee" positioned below the price.

2. **Add a trust banner below the plans grid** with three trust points displayed as inline badges or icons:
   - 30-Day Money-Back Guarantee
   - Cancel Anytime
   - No Tie-In

### Technical Detail

- Use the existing `Badge` component with a custom green/emerald style (matching the existing "Most Popular" badge pattern)
- Add a `ShieldCheck` icon from `lucide-react` for the guarantee badge
- Place the trust banner between the plans grid and the existing FAQ link, styled as a centered flex row with muted styling

### Specific Edits

**Inside each plan card** (after the price `<div>`, around line 112):
```tsx
{plan.price_monthly > 0 && (
  <div className="flex items-center justify-center gap-1 mt-2">
    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
      30-day money-back guarantee
    </span>
  </div>
)}
```

**Below the plans grid** (before the FAQ section, around line 137):
```tsx
<div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
  <div className="flex items-center gap-1.5">
    <ShieldCheck className="h-4 w-4 text-emerald-500" />
    <span>30-Day Money-Back Guarantee</span>
  </div>
  <span className="text-border">|</span>
  <span>Cancel Anytime</span>
  <span className="text-border">|</span>
  <span>No Tie-In</span>
</div>
```

**Import** `ShieldCheck` from `lucide-react` alongside the existing icons.

### No Database Changes

This is a purely frontend/UI update.
