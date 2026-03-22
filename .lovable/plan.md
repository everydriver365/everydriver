

## Plan: Healthcare Benefits — GPS Tier and Above (Option A)

### Strategy
- **Free & All-In**: No healthcare. All-In stays at £4.99/mo — the affordable entry point.
- **GPS (£16/mo → £31/mo)**: Basic healthcare (Dental £150/yr + Optical £100/yr cashback).
- **Single Dashcam (£25/mo → £37/mo)**: Full healthcare (adds GP access, Physio, Mental Health).
- **Duo Dashcam (£29/mo → £42/mo)**: Full healthcare (same as Single).
- **Multi-School (£49/mo → £59/mo)**: Premium healthcare (full + family cover options).

All tiers achieve the £10/mo profit target after £15 healthcare cost.

### Database Changes

**1. Update `subscription_plans` prices**
```sql
UPDATE subscription_plans SET price_monthly = 31 WHERE slug = 'gps';
UPDATE subscription_plans SET price_monthly = 37 WHERE slug = 'single_dashcam';
UPDATE subscription_plans SET price_monthly = 42 WHERE slug = 'duo_dashcam';
UPDATE subscription_plans SET price_monthly = 59 WHERE slug = 'multi_school';
```

**2. Add `healthcare` feature flag to GPS+ plan features**
```sql
UPDATE subscription_plans SET features = features || '["healthcare_basic"]' WHERE slug = 'gps';
UPDATE subscription_plans SET features = features || '["healthcare_full"]' WHERE slug IN ('single_dashcam', 'duo_dashcam');
UPDATE subscription_plans SET features = features || '["healthcare_premium"]' WHERE slug = 'multi_school';
```

**3. Add healthcare rows to `comparison_features`**
Insert new rows in a "Healthcare & Wellbeing" category:
- "Dental cashback (£150/yr)" — ✗ Free, ✗ All-In, ✓ GPS+
- "Optical cashback (£100/yr)" — ✗ Free, ✗ All-In, ✓ GPS+
- "24/7 GP access" — ✗ Free, ✗ All-In, ✗ GPS, ✓ Single+
- "Physio sessions" — ✗ Free, ✗ All-In, ✗ GPS, ✓ Single+
- "Mental health & EAP" — ✗ Free, ✗ All-In, ✗ GPS, ✓ Single+
- "Family cover option" — ✗ all except ✓ Multi-School

**4. Update `comparison_plans` prices** to reflect new pricing in the comparison table.

### Files Changed

| File | Change |
|------|--------|
| Database migration | Update prices, features arrays, add comparison rows |
| `src/pages/ComparisonPage.tsx` | No code changes needed — dynamically renders from DB |
| `src/components/instructor/dashboard/UpgradePlanSheet.tsx` | No code changes — reads from DB |

### What Users See
- The `/compare` page automatically shows the new prices and healthcare feature rows
- GPS+ plans prominently display healthcare as a key differentiator
- Free and All-In users see healthcare benefits locked, encouraging upgrade to GPS tier

