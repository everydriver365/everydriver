

## Add Plan Badge Next to Online Visibility Toggle

### What Changes

Place a clickable plan badge directly next to the "Online" visibility toggle in the desktop instructor dashboard header area, so the instructor can see their current plan at a glance and tap to upgrade.

### Desktop (InstructorPortal.tsx)

The current layout at the top-right of the welcome section:

```text
[Globe icon] Online [Switch]
```

Will become:

```text
[PlanBadge: Pro/Free/etc]  [Globe icon] Online [Switch]
```

The `PlanBadge` will be wrapped in a clickable container that opens the `UpgradePlanSheet` (same sheet already used by `PlanWidget`).

### Implementation Details

**Modified file: `src/pages/InstructorPortal.tsx`**

1. Import `PlanBadge` from `@/components/instructor/PlanBadge` and `UpgradePlanSheet` from `@/components/instructor/dashboard/UpgradePlanSheet`
2. Add state for `upgradeSheetOpen`
3. Get `subscription` from `useInstructorAuth()` (already used in this file)
4. Inside the `shrink-0` div (line 234), prepend a clickable `PlanBadge` before the Online toggle container
5. Render `UpgradePlanSheet` at the bottom of the component (outside the visible layout)

The badge uses the existing `PlanBadge` component with `size="md"` and a cursor-pointer + hover effect, opening the same upgrade sheet used elsewhere.

### No Mobile Changes

The mobile home already has the full `PlanWidget` card in the INSIGHTS section -- no duplication needed. This change is desktop-only, placing a compact badge in the header bar.

### Steps

| Step | Action |
|------|--------|
| 1 | Add imports for `PlanBadge` and `UpgradePlanSheet` |
| 2 | Add `upgradeSheetOpen` state and read `subscription` from auth context |
| 3 | Insert clickable `PlanBadge` next to the Online toggle |
| 4 | Render `UpgradePlanSheet` component |
