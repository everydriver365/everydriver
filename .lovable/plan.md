

## Differentiate Basic vs Enhanced Health in Comparison Table

Currently all healthcare features show "✓ Included" identically for both GPS + Health and Dashcam + Health tiers. We need to clearly show that **GPS + Health = Basic Health** and **Dashcam + Health = Enhanced Health (includes cancer care)**.

### What Changes

**1. Update existing comparison_features healthcare rows**

Split the values so GPS shows "Basic" and Dashcam shows "Enhanced" or "✓" where appropriate:

| Feature | Free | All-In | GPS + Health | Dashcam + Health |
|---------|------|--------|-------------|-----------------|
| Dental cashback (£150/yr) | — | — | ✓ Included | ✓ Included |
| Optical cashback (£100/yr) | — | — | ✓ Included | ✓ Included |
| 24/7 GP access | — | — | ✓ Included | ✓ Included |
| Physio sessions | — | — | ✓ Included | ✓ Enhanced |
| Mental health & EAP | — | — | ✓ Included | ✓ Enhanced |
| Family cover option | — | — | — | ✓ Included |
| **Cancer care & support** | — | — | — | ✓ Included |
| **Hospital cash benefit** | — | — | — | ✓ Included |

**2. Add new Enhanced-only healthcare features**

Insert 2-3 new rows in the `comparison_features` table for features exclusive to Enhanced Health:
- Cancer care & support
- Hospital cash benefit  
- Specialist consultations

These will show "—" for Free/All-In/GPS and "✓ Included" for Dashcam + Health only.

**3. Add a sub-label row or category split**

Rename the category or add a visual separator:
- "Healthcare — Basic" for shared features
- "Healthcare — Enhanced" for Dashcam-only features

Alternatively, keep one "Healthcare & Wellbeing" category but add a row like "Health cover level" with values: `— | — | Basic | Enhanced + Cancer Care`

**4. Update DemoPricingPage.tsx**

Update the hardcoded healthcare section in the demo pricing page to reflect the differentiation.

**5. Update health-benefits page copy**

Update any marketing pages that reference healthcare to clarify the two tiers.

### Technical Details
- All changes are data updates to `comparison_features` table (no schema changes)
- The `/compare` page auto-reflects database changes
- `DemoPricingPage.tsx` has hardcoded feature data that needs manual update

