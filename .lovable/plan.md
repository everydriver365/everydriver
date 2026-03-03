

## Improve "All Features" Page — Show Multi-Plan Badges

### Problem
The existing page at `/instructor-app/all-features` only shows a **single** `plan_tier` badge per feature (from the legacy column on `feature_showcase_items`). The actual plan assignments live in `feature_plan_assignments` and many features are available on multiple plans. Two categories also lack icons in `categoryIcons`.

### Changes to `src/pages/instructor-app/InstructorAllFeatures.tsx`

1. **Fetch plan assignments alongside features** — join `feature_plan_assignments` data so each feature gets an array of plan slugs (free, pro, max, etc.)
2. **Render multiple plan badges per feature** — instead of one `plan_tier` badge, show a row of colored badges for every plan that includes the feature
3. **Add missing category icons** — add `Health & Wellbeing` (Heart/Activity icon) and `Tools & Productivity` (Wrench/Settings icon) to `categoryIcons`
4. **Sort plan badges** in tier order (Free → Pro → Max → Multi → Enterprise)

### No new files, no database changes
Single file modification: `src/pages/instructor-app/InstructorAllFeatures.tsx`

