

## Plan: Revert Prices + Healthcare as Optional Add-On

### What's Changing
1. **Revert subscription plan prices** back to originals (GPS £16, Single £25, Duo £29, Multi-School £49)
2. **Remove healthcare feature flags** from subscription plans
3. **Add "Healthcare" as a new add-on** in the Website Add-Ons marketplace at **£19.99/mo**
4. **Update comparison features** — move healthcare rows to show as "Optional add-on" rather than included

### Database Changes (via insert/update tool)

**1. Revert prices on `subscription_plans`**
```sql
UPDATE subscription_plans SET price_monthly = 16 WHERE slug = 'gps';
UPDATE subscription_plans SET price_monthly = 25 WHERE slug = 'single_dashcam';
UPDATE subscription_plans SET price_monthly = 29 WHERE slug = 'duo_dashcam';
UPDATE subscription_plans SET price_monthly = 49 WHERE slug = 'multi_school';
```

**2. Remove healthcare feature flags from `subscription_plans`**
```sql
UPDATE subscription_plans SET features = features - 'healthcare_basic' WHERE slug = 'gps';
UPDATE subscription_plans SET features = features - 'healthcare_full' WHERE slug IN ('single_dashcam', 'duo_dashcam');
UPDATE subscription_plans SET features = features - 'healthcare_premium' WHERE slug = 'multi_school';
```

**3. Revert prices on `comparison_plans`**
```sql
UPDATE comparison_plans SET price = '£16' WHERE slug = 'gps';
UPDATE comparison_plans SET price = '£25' WHERE slug = 'single_dashcam';
UPDATE comparison_plans SET price = '£29' WHERE slug = 'duo_dashcam';
UPDATE comparison_plans SET price = '£49' WHERE slug = 'multi_school';
```

**4. Update healthcare comparison feature rows** — change plan_values so all plans show "Add-on £19.99/mo" instead of ✓/✗

### Code Changes

| File | Change |
|------|--------|
| `src/hooks/useInstructorAddons.ts` | Add `"healthcare"` to `AddonType` union |
| `src/pages/InstructorWebsiteAddons.tsx` | Add Healthcare add-on card (£19.99/mo) with benefits list: Dental £150/yr, Optical £100/yr, 24/7 GP, Physio, Mental Health, EAP. Update bundle to include healthcare option or keep separate |

### Result
- Base plans stay competitive and affordable
- Healthcare is a clear, optional upsell at £19.99/mo (£4.99 profit per instructor)
- Any instructor on any paid plan can add it
- Comparison page shows healthcare as available add-on across all tiers

