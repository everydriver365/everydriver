

# Attractive Plan Comparison Page

Replace the boring grey bottom-sheet modal with a dedicated, visually striking full-page plan comparison experience.

## What You'll Get

- A beautiful, full-screen plan comparison page instead of the current slide-up grey panel
- Side-by-side card layout on desktop, swipeable cards on mobile
- Your current plan highlighted with a glowing border
- The "Popular" plan (Pro) gets a prominent visual treatment
- Feature comparison with clear check/cross indicators across all plans
- Smooth animations as you scroll through plans
- A clear "Contact to Upgrade" call-to-action on each plan card

## Design Approach

**Mobile**: Full-screen page with vertically stacked plan cards, each with a gradient header showing the plan name, price, and tier icon. The current plan gets a green highlighted border. A sticky header with a back button keeps navigation easy.

**Desktop**: A centered grid of plan cards (up to 5 columns) with the popular plan slightly elevated. A feature comparison table sits below the cards for a detailed side-by-side view.

**Visual Style**: Each tier gets a subtle color accent in its card header (following the existing emerald/teal theme from PlanBadge). Cards use clean borders with the popular plan getting a gradient border effect. Pricing is large and prominent with monthly/yearly toggle option.

## Technical Details

### New File
- `src/pages/InstructorPlans.tsx` -- Full-page plan comparison component that fetches plans from `subscription_plans` table, renders attractive cards with animations (framer-motion), highlights current plan, and shows feature comparison grid.

### Modified Files

1. **`src/components/layout/InstructorPortalLayout.tsx`**
   - Change all `setUpgradeSheetOpen(true)` calls to `navigate("/instructor/plans")` instead
   - Remove `UpgradePlanSheet` import and usage (3 instances)
   - Remove `upgradeSheetOpen` state

2. **`src/pages/InstructorPortal.tsx`**
   - Change the plan badge click handler to `navigate("/instructor/plans")`
   - Remove `UpgradePlanSheet` import and usage
   - Remove `upgradeSheetOpen` state

3. **`src/components/instructor/dashboard/PlanWidget.tsx`**
   - Change button click to navigate to `/instructor/plans` instead of opening the sheet
   - Remove `UpgradePlanSheet` import and usage

4. **`src/App.tsx`** (or routing config)
   - Add route: `/instructor/plans` rendering `InstructorPlans` inside `InstructorPortalLayout`

### Page Structure

```text
+-----------------------------------------------+
|  <- Back to Dashboard          [Current: Pro]  |
+-----------------------------------------------+
|                                                |
|   Choose the Right Plan for Your Business      |
|   Compare features and upgrade anytime         |
|                                                |
|  +--------+ +--------+ +--------+ +--------+  |
|  | FREE   | | PRO    | | MAX    | | MULTI  |  |
|  | ---    | | ---    | | ---    | | ---    |  |
|  | star   | | star   | | zap    | | users  |  |
|  | £0/mo  | | £29/mo | | £49/mo | | £99/mo |  |
|  |        | |POPULAR | |        | |        |  |
|  | 5 max  | | 50 max | | Unlim  | | Unlim  |  |
|  | feat1  | | feat1  | | feat1  | | feat1  |  |
|  | feat2  | | feat2  | | feat2  | | feat2  |  |
|  |  ...   | |  ...   | |  ...   | |  ...   |  |
|  |[Current]| |[Upgrade]| |[Upgrade]| |[Upgrade]|  |
|  +--------+ +--------+ +--------+ +--------+  |
|                                                |
|  Questions? Email hello@drive365.co.uk         |
+-----------------------------------------------+
```

### Key Visual Features
- Plan cards use `framer-motion` staggered fade-in animations
- Popular plan card has a gradient top border and a "Most Popular" ribbon
- Current plan shows a green "Current Plan" badge and disabled button
- Price displayed large with a smaller "/mo" suffix and yearly savings shown
- Feature list with emerald check icons
- Max pupils shown as a highlighted metric
- SMS credits displayed per tier
- Responsive: 1 column on mobile, 2 on tablet, up to 5 on wide desktop
- Professional flat design consistent with the existing portal aesthetic (sharp corners, no glassmorphism)
