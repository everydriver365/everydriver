

# Plan Settings Overhaul: Feature-Plan Matrix with Checkboxes

## Overview

Replace the current single `plan_tier` column approach on `feature_showcase_items` with a proper many-to-many relationship so each feature can be ticked on/off for each plan. Create a new dedicated admin page for this, accessible from its own tab in the admin navigation. Also add a "Contact Us" option for plan pricing.

## Database Changes

### New table: `feature_plan_assignments`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Default gen_random_uuid() |
| feature_id | uuid FK -> feature_showcase_items(id) ON DELETE CASCADE | |
| plan_slug | text | e.g. 'free', 'pro', 'max', 'multi', 'enterprise' |
| created_at | timestamptz | Default now() |
| UNIQUE(feature_id, plan_slug) | | Prevent duplicates |

### Seed data

Migrate existing `plan_tier` data into the new table. For each feature, assign it to the matching plan and all higher plans (since currently a feature on "free" means it's available on all plans above too). This will pre-populate the checkboxes.

### Subscription plans: `show_contact_us` column

Add a `show_contact_us` boolean column (default false) to `subscription_plans`. When true, the plans page shows "Contact Us" instead of a price.

## New Component: `PlanFeatureMatrixManager.tsx`

A full-page admin component that displays:

- A table with all features from `feature_showcase_items` grouped by category
- Column headers for each plan (Free, Pro, Max, Multi, Enterprise)
- A checkbox at each intersection
- Checking/unchecking inserts/deletes from `feature_plan_assignments`
- Changes save immediately on toggle (no save button needed)

### Layout

```
Category / Feature          | Free | Pro | Max | Multi | Enterprise
----------------------------------------------------------------
Diary & Scheduling
  Drag-and-drop calendar    |  [x] | [x] | [x] |  [x]  |    [x]
  Google Calendar sync      |  [x] | [x] | [x] |  [x]  |    [x]
  Gap-fill SMS blasts       |  [ ] | [x] | [x] |  [x]  |    [x]
Pupil Management
  Pupil profiles            |  [x] | [x] | [x] |  [x]  |    [x]
  Automated follow-ups      |  [ ] | [ ] | [x] |  [x]  |    [x]
...
```

## Admin Navigation Changes

### `AdminLayout.tsx`

Add a new nav tab:
```
{ id: "plan-features", label: "Plan Features", icon: CheckSquare }
```

Map it in `sectionToTab` and add it to `navTabs`.

### `AdminPortal.tsx`

- Add `plan-features` to `sectionMeta`
- Add a new `case "plan-features"` in the section renderer that shows `PlanFeatureMatrixManager`

## Plan Pricing: "Contact Us" Option

### `SubscriptionPlansManager.tsx` (edit dialog)

Add a toggle: "Show 'Contact Us' instead of price". When enabled, the price fields can be left as-is but won't be displayed on the plans page.

### `InstructorPlans.tsx`

Update the price display section: if `show_contact_us` is true, show "Contact Us" instead of the price.

## Files Summary

| File | Change |
|------|--------|
| **Migration** | Create `feature_plan_assignments` table, seed from existing data, add `show_contact_us` to `subscription_plans` |
| **New** `src/components/admin/PlanFeatureMatrixManager.tsx` | Checkbox matrix UI |
| `src/components/admin/AdminLayout.tsx` | Add "Plan Features" nav tab |
| `src/pages/AdminPortal.tsx` | Add section metadata + case for rendering |
| `src/components/admin/SubscriptionPlansManager.tsx` | Add "Contact Us" toggle in edit dialog |
| `src/pages/InstructorPlans.tsx` | Respect `show_contact_us` flag in price display |

## Technical Details

- The `PlanFeatureMatrixManager` fetches all `feature_showcase_items` (ordered by category + display_order) and all `feature_plan_assignments`, then renders the matrix
- Toggling a checkbox does an upsert or delete on `feature_plan_assignments`
- RLS: Admin-only write access via `has_role('admin')`, public read for the assignments table
- The existing `plan_tier` column on `feature_showcase_items` remains for backward compatibility but the matrix becomes the source of truth

