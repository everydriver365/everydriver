

## Admin Fee Income Tile on Dashboard

### What
Add a new stat tile to the admin dashboard overview that shows admin fee income across four time periods: **Today**, **This Week**, **This Month**, and **Year to Date**. Data comes from the existing `platform_commissions` table which already records every fee from all payment providers.

### How

**New component**: `src/components/admin/AdminFeeIncomeTile.tsx`
- Queries `platform_commissions` table with date filters for today, this week (Monday start), this month, and YTD
- Sums `commission_amount` for each period
- Renders as a single `StatCard`-style tile with the monthly figure as the headline value and a small breakdown showing daily/weekly/YTD as subtitles
- Alternatively, renders as a compact card with 4 mini-stats (Today / Week / Month / YTD) in a 2×2 grid inside the card
- Clicking navigates to the existing `commission` section

**Modify**: `src/components/admin/AdminSettingsGrid.tsx`
- Import and render `AdminFeeIncomeTile` in the stats tiles row (add it to the grid alongside existing stat cards like Instructors, Revenue, Bookings, etc.)
- Pass `onNavigate` so clicking drills into the commission dashboard

### Data Query
```typescript
// Single query, filter client-side for periods
const { data } = await supabase
  .from("platform_commissions")
  .select("commission_amount, created_at")
  .gte("created_at", startOfYear);

// Then sum by period: today, thisWeek, thisMonth, ytd
```

### UI Layout (inside the tile)
```text
┌─────────────────────────┐
│ £ Admin Fee Income      │
│                         │
│  Today    £12.40        │
│  This Week £84.20       │
│  This Month £342.60     │
│  Year to Date £2,148.00 │
└─────────────────────────┘
```

### Files
| File | Action |
|------|--------|
| `src/components/admin/AdminFeeIncomeTile.tsx` | Create — self-contained component querying `platform_commissions` |
| `src/components/admin/AdminSettingsGrid.tsx` | Modify — add the tile to the stats grid area |

