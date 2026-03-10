

## Admin Portal Navigation Audit

### Current Problem: Three Duplicate Navigation Systems

The admin portal has **three independent navigation layers** that all point to the same sections, creating confusion about where to click:

```text
┌─────────────────────────────────────────────────────┐
│  LAYER 1: Top Header Bar (11 tabs)                  │
│  Settings | Courses | Instructors | Subscribers |   │
│  Plans | Websites | Domains | Pupils | Money |      │
│  Stats | CMS                                        │
├─────────────────────────────────────────────────────┤
│  LAYER 2: Sidebar (7 groups, ~30 items)             │
│  Dashboard / People / Learner Website /             │
│  Instructor Platform / Products & Booking /         │
│  Engagement & Rewards / System Settings             │
├─────────────────────────────────────────────────────┤
│  LAYER 3: Overview Dashboard Grid (8 groups, ~30    │
│  tiles + 8 stat tiles)                              │
│  Communications / People / Finance / Products /     │
│  Learner Website / Instructor Platform /            │
│  Engagement / System Settings                       │
└─────────────────────────────────────────────────────┘
```

### Specific Duplicates Found

| Function | Header Tab | Sidebar Item | Dashboard Tile | Stat Tile |
|---|---|---|---|---|
| Instructors | "Instructors" | People > Instructors | People > Instructors | "Instructors" stat |
| Pupils/Enquiries | "Pupils" | People > Enquiries | People > Pupil Records + Comms > Enquiries | -- |
| Payments | "Money" | Products > Payment History | Finance > Payment History | "Revenue" + "Pupil Payments" |
| Bookings | "Stats" | Products > All Bookings | Finance > All Bookings | "Bookings" stat |
| Courses | "Courses" | Products > Course Templates | Products > Course Templates | "Courses Booked" stat |
| Websites | "Websites" | Instructor Platform > Mini Websites | Instructor Platform > Mini Websites | -- |
| Domains | "Domains" | Instructor Platform > Domains | Instructor Platform > Domains | -- |
| CMS | "CMS" | Learner Website > (9 items) | Learner Website > (7 items) | -- |

### Recommendation: Remove the Top Header Tabs

**Keep**: Sidebar (primary navigation) + Dashboard overview grid (landing page with quick access)
**Remove**: The 11 top header tabs -- they are a flat, redundant duplicate of the sidebar

### Proposed Changes

1. **Remove `navTabs` from `AdminLayout.tsx`** -- delete the entire top nav bar rendering (both desktop and mobile). The sidebar already provides grouped, organized navigation to every section.

2. **Keep the header bar** but only for: logo, search box, and logout button. This makes it a clean utility bar.

3. **Keep the dashboard overview grid as-is** -- it serves as a useful "home screen" with stats and quick-access tiles. It's not redundant because it adds context (descriptions, badge counts, stats).

4. **Consolidate the two duplicate stat tiles on the dashboard**:
   - Remove "Pupil Payments" (duplicate of "Revenue" -- both go to payments)
   - Remove "Subscribers" stat tile (it just says "View" with no count)
   - Keep: Instructors, Revenue, Bookings, Courses Booked, Live Map, Analytics (6 tiles instead of 8)

5. **Ensure the sidebar is always visible on desktop** with the collapse-to-icons behavior it already has.

### Files to Change

- **`src/components/admin/AdminLayout.tsx`** -- Remove the `navTabs` array and both desktop/mobile nav tab rendering blocks. Keep header with logo, search, and logout only.
- **`src/components/admin/AdminSettingsGrid.tsx`** -- Remove the duplicate "Pupil Payments" and "Subscribers" stat tiles.

This is a relatively small change that eliminates the "where do I click?" problem without losing any functionality.

