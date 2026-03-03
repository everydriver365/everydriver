

## Design Consistency Audit: Homepage vs Sub-Pages

### Current State

The homepage tiles use a very specific design language:
- **Background**: `#F2F3F5` (light) / `#1C1C1E` (dark)
- **Border radius**: `rounded-[20px]`
- **Shadow**: `0px 8px 20px rgba(0,0,0,0.08), 0px 2px 6px rgba(0,0,0,0.04)`
- **Inset highlight**: `ring-1 ring-inset ring-white/60 dark:ring-white/5`
- **Tap animation**: `scale(0.98)` spring

The sub-pages are **not consistent**. Most use the standard shadcn `<Card>` component which renders with:
- `bg-card` (white in light mode)
- `rounded-xl` (12px, not 20px)
- `shadow-sm` (much lighter shadow)
- `border` (solid border instead of inset ring highlight)
- No tap animation

### Pages That Need Updating

The `InstructorCard` component already exists and encapsulates the homepage style, but it's only used in **1 sub-page** (Jobs). Here are the pages still using the old `<Card>`:

| Page | Component(s) using old `<Card>` |
|---|---|
| **Pupils** | Pupil list cards, pupil detail panels |
| **Expenses** | `ExpenseTracker` — expense list items, add form |
| **Settings** | ~20+ collapsible setting sections |
| **Locations** | Uses `GlassCard` (closer but still `bg-card`, no 20px radius, no matching shadow) |
| **Gaps & Waitlist** | Header uses old 8px rounded-lg icon, inner cards from `GapsFiller`/`WaitlistManager` |
| **Vehicle Health** | Multiple tab cards (`ComplianceOverview`, `SecurityAlertsTab`, etc.) |
| **Schedule** | View toggle pills use `bg-card shadow-sm` |
| **Plans** | Plan tier cards use `bg-card` with border |
| **Test Results** | Standard Card components |
| **Test Requests** | Standard Card components |
| **CPD Log** | Standard Card components |
| **Referrals** | Standard Card components |
| **Availability** | Standard Card components |
| **Nearby ADIs** | Standard Card components |

### Proposed Approach

This is a large-scope refactor touching 15+ pages and 30+ inner components. I recommend a phased approach targeting the **highest-traffic pages first**:

**Phase 1 — High-traffic pages (6 pages)**
1. **Pupils** — Replace `<Card>` with `<InstructorCard>` for pupil list items
2. **Schedule** — Update toggle pills and any card containers
3. **Expenses** — Update `ExpenseTracker` card wrappers
4. **Settings** — Update collapsible section containers
5. **Locations** — Migrate `GlassCard` usage to `InstructorCard`
6. **Gaps** — Fix header icon to 44px circle + update inner cards

**Phase 2 — Secondary pages (8+ pages)**
- Vehicle Health, Plans, Test Results, Test Requests, CPD, Referrals, Availability, Nearby ADIs

**Also update `GlassCard`** to match the homepage spec (or deprecate it in favour of `InstructorCard`), since they currently diverge.

### What Each Update Involves
For each page:
- Swap `<Card>` / `<GlassCard>` imports to `<InstructorCard>`
- Replace `<CardContent>` padding with `InstructorCard`'s built-in `p-5`
- Remove `<CardHeader>` / `<CardTitle>` wrappers (use inline headings instead)
- Add `interactive` prop where cards are tappable
- Ensure headers use `<InstructorPageHeader>` with the 44px circle icon

### Recommendation
Start with Phase 1 (6 pages). This covers 90%+ of daily user interactions and will make the app feel immediately cohesive. Phase 2 can follow as a separate task.

