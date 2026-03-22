

## Plan: Wire Up Plan-Based Feature Gating Across the Instructor App

### Current State
- Feature gating **only works on the Menu page** (`InstructorMenu.tsx`) via `useMenuFeatureGates`
- The desktop sidebar, quick access tiles, and all 79+ individual pages have **zero feature gating**
- Instructors can navigate directly to any URL regardless of plan
- The "Upgrade" button on `/instructor/plans` just shows a toast saying "contact us" — no actual plan switching
- `hasFeature()` exists in the auth context but is **never called** anywhere in the app

### What Needs to Change

#### 1. Create a `<FeatureGate>` wrapper component
A reusable component that checks the instructor's subscription features and either renders children or shows an upgrade prompt. Used at the route/page level.

```
<FeatureGate requiredFeature="telematics" fallback={<UpgradePrompt />}>
  <FleetDashboard />
</FeatureGate>
```

#### 2. Create an `<UpgradePrompt>` page
A full-page "This feature requires X plan" component with a CTA to `/instructor/plans`. Shows when an instructor navigates to a gated route.

#### 3. Gate all instructor routes
Wrap gated routes in `instructorPortalRoutes.tsx` with `<FeatureGate>`. Map each route to its `required_feature` from `menu_feature_gates`. Routes without a gate (schedule, pupils, messages, etc.) remain open.

#### 4. Gate the desktop sidebar
Update `InstructorDesktopSidebar.tsx` to use `useMenuFeatureGates` — show lock icons and prevent navigation for locked items, matching the mobile menu behavior.

#### 5. Gate the quick access tiles
Update `SwipeableQuickAccess.tsx` to check feature gates — show locked tiles with a lock overlay and redirect to upgrade on tap.

#### 6. Add self-service plan switching
Update `InstructorPlans.tsx` so instructors can change their own plan:
- Add a `changePlan` function that updates `instructor_subscriptions.plan_id`
- Show confirmation dialog before switching
- Refresh the auth context after switching so gating updates immediately
- For paid plans, keep the "Contact Us" CTA; for downgrading to Free or switching between plans at the same tier, allow instant switching

#### 7. Refresh features on plan change
After plan change, call `refreshInstructor()` from auth context so all gating re-evaluates without a page reload.

### Files Changed

| File | Change |
|------|--------|
| `src/components/instructor/FeatureGate.tsx` | **New** — reusable gate wrapper |
| `src/components/instructor/UpgradePrompt.tsx` | **New** — full-page upgrade CTA |
| `src/routes/instructorPortalRoutes.tsx` | Wrap gated routes with `<FeatureGate>` |
| `src/components/instructor/InstructorDesktopSidebar.tsx` | Add feature gate checks + lock icons |
| `src/components/instructor/SwipeableQuickAccess.tsx` | Add feature gate checks + lock overlay |
| `src/pages/InstructorPlans.tsx` | Add self-service plan switching with confirmation |
| `src/context/InstructorAuthContext.tsx` | No changes needed — `hasFeature` + `refreshInstructor` already exist |
| `src/hooks/useMenuFeatureGates.ts` | No changes needed — already provides all gating logic |

### Key Design Decisions
- Gating is driven by the existing `menu_feature_gates` table + `subscription_plans.features` array — no new tables needed
- The `useMenuFeatureGates` hook is reused everywhere (not duplicated)
- Direct URL access is blocked at the route level, not just the nav
- Plan switching updates the DB row and refreshes context immediately

