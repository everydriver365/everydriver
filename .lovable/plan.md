

## Plan: School Subscription & Billing Section

### Overview
Add a "Subscription & Billing" section to the school portal where school managers can view their current plan, see per-instructor subscription statuses, and review billing history. This reuses the existing `instructor_subscriptions` and `subscription_plans` tables — no new tables needed.

### New Files

**`src/components/school/SchoolSubscriptionSection.tsx`**
- **Current Plan card**: Shows school name, number of instructors, total monthly cost (sum of all instructor subscription amounts)
- **Per-Instructor Breakdown table**: Lists each school instructor with their plan name, status (active/cancelled/past_due), billing cycle, current period end, and monthly amount — fetched by joining `instructor_subscriptions` with `subscription_plans` filtered by `instructorIds`
- Status badges: active = green, past_due/late = amber, cancelled = red, free = grey
- **Billing History**: Lists recent `subscription_payments` for school instructors showing date, amount, status, and payment method
- Summary cards at top: Total Active Subscriptions, Monthly Revenue, Overdue count

### Files to Modify

1. **`src/components/school/SchoolLayout.tsx`**
   - Add `{ key: "subscription", label: "Subscription & Billing", icon: CreditCard }` to the Financials group
   - Add to `sectionMeta`

2. **`src/pages/SchoolPortal.tsx`**
   - Add `case "subscription"` rendering `<SchoolSubscriptionSection />`
   - Import the new component

3. **`src/pages/DemoSchoolPortal.tsx`**
   - Add `case "subscription"` with demo data

4. **`src/components/admin/AdminSchoolManager.tsx`**
   - Add `"subscription"` to `FEATURE_DEFS` so admin can toggle it

### Technical Notes
- No database migration needed — queries join existing `instructor_subscriptions` + `subscription_plans` tables filtered by `instructorIds`
- Read-only for school managers — plan changes are handled by admin or instructors themselves
- Uses the same `instructorIds` scoping pattern as all other school sections

