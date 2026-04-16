

## Plan: Redesign Earnings Screen (InstructorPay) with Premium iOS Tile Style

### Overview
Restyle `src/pages/InstructorPay.tsx` to match the exact premium iOS tile spec. All logic, data fetching, expandable panels, navigation, and modals remain untouched — only the JSX markup and styling changes.

### Changes — Single file: `src/pages/InstructorPay.tsx`

**Shared styling constants** (top of file):
```
cardClass = white bg, rounded-[20px], overflow-hidden, specific box-shadow + border
gradientLine = h-[2px] bg-gradient-to-r from-[#0d4fa0] to-[#56a8f5]
```

**1. Hero Earnings Card** (lines 222–278)
- Replace gradient: `bg-gradient-to-br from-[#0d1b2e] to-[#1c2b4a]`, shadow `0 8px 24px rgba(13,27,46,0.35)`
- Section label: "Net Earnings · This Month", 10px uppercase, `rgba(255,255,255,0.5)`
- £ figure: 36px bold white
- Change badge: pill with `bg-[#fff0f0] text-[#e24b4a]` for negative, `bg-[#eaf3de] text-[#4a8c3f]` for positive, with arrow icon
- Bottom stats row: border-top `0.5px solid rgba(255,255,255,0.1)`, 3 columns (This Week, Last Month, Per Hour) with `border-left` dividers between columns
- Flush gradient line at bottom

**2. Summary Tiles — 2×2 grid** (lines 280–501)
- Grid: `grid-cols-2 gap-[10px]`
- Each tile: white card with `padding: 14px 14px 12px`, 36×36 icon square (10px radius, tinted bg)
  - Owes Money: red tint `#fff0f0`, number in `#e24b4a`
  - Recent Payments: blue tint `#eef4fd`
  - Course Rewards: green tint `#eaf3de`
  - Pupil Balances: blue tint `#eef4fd`
- Number: 22px bold `#1c1c1e`, label: 12px `#8e8e93` with `›` chevron right-aligned
- Each card ends with gradient line
- Expandable content below each card remains identical

**3. Quick Actions section** (lines 504–582)
- Section label: 11px bold uppercase `#8e8e93`, letter-spacing 0.06em
- Grid: `grid-cols-2 gap-[10px]`
- Take Payment: `bg-gradient-to-br from-[#0d4fa0] to-[#1a6fd4]`, shadow `0 6px 20px rgba(26,111,212,0.35)`, icon square `rgba(255,255,255,0.2)`, white text, bottom line `rgba(255,255,255,0.25)`
- Accounts: white card, blue icon `#eef4fd`, title 14px bold `#1c1c1e`, subtitle 12px `#8e8e93`, gradient underline
- Other action tiles (Expenses, Bonus, Mileage, Tax Summary): same white card style as Accounts

**4. Page wrapper**
- Background `#f2f2f7` on the content area
- All `mb-10` between sections via the card `margin-bottom: 10px`

### What stays the same
- All state, data fetching, expand/collapse logic, chase reminders, payment modal, forecaster
- Navigation links and `haptics.selection()` calls
- `InstructorPortalLayout` wrapper
- `EarningsForecaster` component at bottom

