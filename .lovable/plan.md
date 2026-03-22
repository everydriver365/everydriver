

## Findings: Comparison Table Data Accuracy & Live Sync

### 1. Admin Edits DO Reflect on the Comparison Page ✅
The ComparisonEditor and ComparisonPage both read from the same `comparison_plans` and `comparison_features` tables via React Query. When you edit a feature toggle or plan price in the admin editor, it updates the database and the comparison page reflects changes on next load. **This works correctly.**

### 2. Slug Mismatch Bug 🐛
Some features inserted in the second batch use **wrong slugs** (`single_cam`, `duo_cam`) while the plans use `single_dashcam`, `duo_dashcam`. This means ~8 features (SMS notifications, Expense tracking, Custom domain, Google Calendar, Klarna, Digital waivers, Daily manifest, Abandoned checkout) show as **missing/false** for Single Dashcam and Duo Dashcam columns even though they should be `true`.

**Fix**: Update those rows' `plan_values` JSONB to use the correct slugs.

### 3. Two Disconnected Plan Systems ⚠️
The platform has **two separate plan systems** that are NOT linked:

| System | Table | Plans | Used For |
|--------|-------|-------|----------|
| Comparison display | `comparison_plans` + `comparison_features` | Free, All-In, GPS, Single Dashcam, Duo Dashcam, Multi-School | The `/compare` page only |
| Actual billing & gating | `subscription_plans` + `menu_feature_gates` | Free, Pro, Max, Multi, Enterprise | Feature locking, onboarding, billing, instructor auth |

Editing the comparison table does **not** change what features an instructor actually gets. The old Pro/Max/Enterprise plans are still what controls real access. These two systems need to be unified — the `subscription_plans` table should be updated to match the new tier names, and `menu_feature_gates` should reference the new plan slugs.

### Proposed Fix (3 steps)

#### Step 1: Fix slug mismatch in comparison_features
Update ~8 rows where `plan_values` uses `single_cam`/`duo_cam` to use the correct `single_dashcam`/`duo_dashcam` keys.

#### Step 2: Align subscription_plans with new tiers
Update the `subscription_plans` table to match the 6 new tiers (Free/All-In/GPS/Single Dashcam/Duo Dashcam/Multi-School) so billing, onboarding, and feature gating all use the same plan structure as the comparison page.

#### Step 3: Update menu_feature_gates references
Ensure `required_feature` values in `menu_feature_gates` map correctly to the feature arrays in the updated `subscription_plans` rows.

### Files Modified
| File | Change |
|------|--------|
| Data fix (comparison_features) | Update `plan_values` JSONB to fix slug mismatch |
| Data fix (subscription_plans) | Align plan names/slugs with new tier structure |
| Data fix (menu_feature_gates) | Update feature references if needed |
| No code changes | The UI already reads dynamically from these tables |

