

## Plan: Remove Redundant Plan Matrix from Admin

### Why
The "Plan Feature Matrix" (`plan-features`) edits `feature_showcase_items` and `feature_plan_assignments` tables using outdated plan slugs (free/pro/max/multi/enterprise). No page, component, or feature gate reads from these tables. The Comparison Editor already serves this purpose with the correct 6-tier plan model.

### Changes

| File | Change |
|------|--------|
| `src/components/admin/PlanFeatureMatrixManager.tsx` | Delete file |
| `src/pages/AdminPortal.tsx` | Remove `plan-features` case and import |
| `src/components/admin/AdminDesktopSidebar.tsx` | Remove `plan-features` sidebar item |
| `src/components/admin/AdminSettingsGrid.tsx` | Remove `plan-features` grid card |

### Notes
- The `feature_showcase_items` and `feature_plan_assignments` database tables can be cleaned up later if desired — removing the UI is the immediate win
- The Comparison Editor remains the single admin tool for managing plan features

