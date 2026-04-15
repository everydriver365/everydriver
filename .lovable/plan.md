

## Make Instructor App Consistently iOS-Styled

The homepage already uses iOS-native design language (#F2F2F7 bg, SF Pro fonts, GlassCards, rounded-[16px] tiles with hairline borders, system blue accents). The layout wrapper already applies `#F2F2F7` to all mobile pages. Several sub-pages still use shadcn Card/Tabs components that look out of place. This plan brings visual consistency across all key instructor pages.

### What's already iOS-styled
- **Homepage** (all layout variants) — full iOS native
- **Settings** — already uses 29px icon roundels, grouped list dividers, collapsible tiles
- **Layout header/nav** — frosted glass `backdrop-blur-xl`, system blue back chevron, iOS bottom tab bar

### Pages to update (mobile views only, per mobile update policy)

**Batch 1 — High-traffic pages**

| Page | Current | Change |
|------|---------|--------|
| `InstructorPay.tsx` | Mixed — vault card is good, but quick-action grid uses inconsistent styles | Wrap action tiles in iOS grouped list style; standardise section headers to `text-[13px] uppercase tracking-wide` |
| `InstructorSchedule.tsx` | Uses `InstructorPageHeader` with 44px circle icon, shadcn `DropdownMenu` | Replace header with compact iOS nav title; style view-mode selector as `IOSSegmentedControl`; remove `InstructorPageHeader` |
| `InstructorPupils.tsx` | Uses `IOSLargeTitle` + `IOSSearchBar` ✓ but pupil cards use shadcn `Card` | Restyle pupil list items as iOS grouped list rows; use `IOSGroupedList` wrapper |
| `InstructorPipeline.tsx` | Uses `InstructorPageHeader` with 32px icon | Replace with iOS inline title; style Kanban columns with iOS card aesthetic |
| `InstructorMessages.tsx` | Delegates to `InstructorInbox` | Style conversation list as iOS-style rows (avatar + name + preview + timestamp + chevron) |

**Batch 2 — Secondary pages**

| Page | Change |
|------|--------|
| `InstructorHealth.tsx` | Wrap health cards in GlassCard; iOS grouped sections |
| `InstructorExpenses.tsx` | iOS grouped list for expense entries |
| `InstructorAccounts.tsx` | iOS section headers + grouped card style |
| `InstructorJobs.tsx` | Job cards as iOS list rows |
| `InstructorNotifications.tsx` | Notification items as iOS list rows |

### Design tokens to standardise

All updated pages will use:
- **Background**: inherited from layout (`#F2F2F7`)
- **Cards**: `bg-white rounded-[10px] shadow-sm` (not shadcn `bg-card border`)
- **Section headers**: `text-[13px] font-normal text-muted-foreground uppercase tracking-wide px-4 pb-1.5`
- **List dividers**: `divide-y divide-border/40` inside card containers
- **Row padding**: `px-4 py-3`
- **Icon containers**: `h-[29px] w-[29px] rounded-[7px]` with coloured backgrounds
- **Font stack**: `-apple-system, 'SF Pro Text', sans-serif` (already set on homepage)
- **Accent blue**: `hsl(211 100% 50%)` for interactive elements

### Implementation approach

1. **Create a shared `IOSPageWrapper`** component that applies the iOS font stack and consistent spacing to any page content (avoiding per-page duplication)
2. Update each page's mobile view in priority order (Batch 1 first)
3. Replace `InstructorPageHeader` usage with a simpler iOS inline title pattern
4. Swap shadcn `Card` wrappers for `bg-white rounded-[10px] shadow-sm` or `GlassCard` where appropriate
5. Convert `Tabs`/`TabsList` to `IOSSegmentedControl` where used as view-mode toggles

### Files to create
- `src/components/instructor/IOSPageWrapper.tsx` — shared wrapper for consistent iOS page styling

### Files to edit (Batch 1)
- `src/pages/InstructorSchedule.tsx`
- `src/pages/InstructorPupils.tsx`
- `src/pages/InstructorPipeline.tsx`
- `src/pages/InstructorMessages.tsx`
- `src/pages/InstructorPay.tsx`
- `src/components/instructor/InstructorInbox.tsx`
- `src/components/instructor/pipeline/KanbanBoard.tsx`

### Files to edit (Batch 2)
- `src/pages/InstructorHealth.tsx`
- `src/pages/InstructorExpenses.tsx`
- `src/pages/InstructorAccounts.tsx`
- `src/pages/InstructorJobs.tsx`
- `src/pages/InstructorNotifications.tsx`

This is a large visual refresh — I'll implement Batch 1 first, then Batch 2 in a follow-up if you're happy with the direction.

