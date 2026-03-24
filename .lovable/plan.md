

## Churn Analysis Dashboard for Admin Portal

A new admin section providing detailed subscriber churn analytics broken down by tier, with trends over time and actionable insights.

### What You Get

- **Churn summary cards**: Current churn rate, total churned (30d), average subscription lifetime, net subscriber change
- **Churn by tier breakdown**: Bar chart showing churn counts per plan (Free, All-In, GPS+Health, Dashcam+Health)
- **Churn trend over time**: Area chart showing monthly churn rate over last 6 months
- **Retention cohort view**: Table showing how many subscribers from each month are still active
- **At-risk subscribers list**: Table of subscriptions nearing expiry or with failed payments

### Data Sources (all existing)

- `instructor_subscriptions` — status, plan_id, created_at, current_period_end
- `subscription_plans` — plan names, slugs, pricing
- `subscription_payments` — payment status for identifying failed payments

No database changes needed. All data is already available.

### Technical Steps

1. **Create `src/components/admin/ChurnAnalyticsDashboard.tsx`** — new component with:
   - Fetches all subscriptions + plans from database
   - Computes churn rate per tier (inactive subs whose period ended in last 30 days)
   - Builds 6-month trend data by iterating months
   - Cohort retention table grouping subscribers by signup month
   - At-risk list filtering subscriptions with `current_period_end` in next 14 days or failed payment status
   - Uses Recharts (BarChart, AreaChart) matching existing `RevenueAnalytics` patterns
   - Uses existing StatCard, Card, Table, Badge components

2. **Register in `src/pages/AdminPortal.tsx`**:
   - Add "Churn Analysis" as a new sidebar item under the existing analytics/pricing group
   - Wire it to render `ChurnAnalyticsDashboard` when selected

### Files Modified
- `src/components/admin/ChurnAnalyticsDashboard.tsx` (new)
- `src/pages/AdminPortal.tsx` (add import + sidebar item + render case)

