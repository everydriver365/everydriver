

## Simplify to 4-Tier Pricing Model

Consolidate the current 6-tier structure into 4 clean tiers with healthcare bundled into the hardware plans.

### New Pricing Structure

| Tier | Price | What's Included |
|------|-------|----------------|
| **Free** | £0 | Basic diary, calendar, mini website |
| **All-In** | £4.99 | All digital features (AI, MTD, SMS, payments) |
| **GPS + Health** | £29.99 | All-In + GPS tracking + Basic Health cover |
| **Dashcam + Health** | £49.99 | All-In + Dashcam + Enhanced Health cover |

Multi-School moves to a hidden "contact us" flow (deactivated from public pricing).

### Implementation Steps

**1. Update `subscription_plans` table data**
- Update GPS tier: rename to "GPS + Health", change price from £16 → £29.99, add `healthcare_basic` to features, update description
- Update Single Dashcam tier: rename to "Dashcam + Health", change price from £25 → £49.99, add `healthcare_enhanced` to features, update description
- Deactivate Duo Dashcam tier (`is_active = false`) — handle as in-dashboard upsell later
- Deactivate Multi-School tier (`is_active = false`) — move to franchise enquiry flow

**2. Update `comparison_plans` table data**
- Update GPS plan: name → "GPS + Health", price → "£29.99", description updated
- Update Single Dashcam plan: name → "Dashcam + Health", price → "£49.99", description updated
- Remove/hide Duo Dashcam and Multi-School comparison columns

**3. Update `comparison_features` healthcare rows**
- Change healthcare plan_values: GPS → ✓ (included), Single Dashcam → ✓ (included), Free/All-In → "—"

**4. Update UI components**
- `UpgradePlanSheet.tsx` — will auto-reflect from database changes
- `StepPlanSelection.tsx` — will auto-reflect
- Compare page — will auto-reflect since it's database-driven
- Update any hardcoded references to "Single Dashcam" or "Duo Dashcam" tier names in marketing copy

**5. Add healthcare add-on option for lower tiers**
- Add `healthcare_basic` and `healthcare_enhanced` as add-on types in the instructor add-on marketplace (for Free/All-In users who want health cover without hardware)
- Basic Health: £20.50/mo, Enhanced Health: £30/mo

### Technical Details
- All pricing changes are data updates (no schema migrations needed)
- The comparison page is fully database-driven so it updates automatically
- Feature gating already works via the `features` array on plans
- The `instructor_addons` table already supports custom add-on types

