

## Elevate Instructor Pages — From Flat to Rich iOS

The iOS structure is right (rounded-[10px], SF Pro, section headers), but the pages feel monotone because every card is plain white with a thin border. Real iOS apps like Health, Wallet, and Fitness use **colour accents, subtle gradients, tinted icon backgrounds, and layered depth** to create visual interest.

### Design upgrades

**1. Tinted section hero cards** — Each major page gets a coloured hero/summary card at the top (like the Pay vault card already has), creating an immediate visual anchor:
- **Health**: Rose/pink gradient hero showing today's wellness score
- **Pipeline**: Blue-to-indigo gradient showing lead funnel summary
- **Schedule**: Warm amber gradient with today's lesson count
- **Notifications**: Purple gradient with unread badge count
- **Messages**: Indigo gradient with conversation stats
- **Expenses**: Emerald gradient with month-to-date spend
- **Jobs**: Teal gradient with pending offers count

**2. Coloured icon roundels on quick-stat tiles** — Replace the monochrome `bg-primary/10` icon circles with category-specific tinted backgrounds (rose for health, sky for water, amber for alerts, emerald for money) — similar to iOS Settings icons.

**3. Subtle card gradients** — Replace flat `bg-card border` with `bg-gradient-to-br from-white to-[color]/5` on interactive tiles, giving them warmth without being heavy.

**4. Staggered entrance animations** — Add `motion.div` with cascading `delay` values (already partially done on Pay) to all page sections, making content feel alive on load.

**5. Improved shadow layering** — Upgrade from `shadow-[0_2px_8px_rgba(0,0,0,0.04)]` to the richer `InstructorCard`-style multi-layer shadows on key interactive tiles.

**6. Section divider lines** — Add thin `h-px bg-border/30 mx-4` dividers between major sections for clearer visual rhythm.

### Files to edit

| File | Change |
|------|--------|
| `InstructorHealth.tsx` | Add rose gradient hero card; colour-code stat tiles |
| `InstructorPipeline.tsx` | Add blue gradient summary banner above Kanban |
| `InstructorNotifications.tsx` | Add purple gradient unread hero; improve notification row styling |
| `InstructorMessages.tsx` | Add indigo gradient stats hero |
| `InstructorExpenses.tsx` | Add emerald gradient month summary hero |
| `InstructorJobs.tsx` | Add teal gradient hero with pending count |
| `InstructorPay.tsx` | Improve summary tile gradients and icon colours (vault card is already good) |
| `InstructorSchedule.tsx` | Add amber/warm gradient today summary |
| `KanbanBoard.tsx` | Tint column headers with stage colours; improve card depth |
| `InstructorAccounts.tsx` | Add gradient hero showing balance overview |

### What stays the same
- Page structure, font stack, `IOSPageWrapper` usage
- Functional logic — zero behaviour changes
- Mobile-only scope (per policy)

### Pattern for hero cards
```text
┌──────────────────────────────────┐
│  gradient bg (e.g. rose→pink)    │
│  ┌──┐                           │
│  │🏥│  Health & Wellness         │
│  └──┘  3 metrics tracked today   │
│                                  │
│  ┌──────┐ ┌──────┐ ┌──────┐     │
│  │ 72kg │ │ 6/8  │ │120/80│     │
│  │Weight│ │Water │ │ BP   │     │
│  └──────┘ └──────┘ └──────┘     │
└──────────────────────────────────┘
```

Each hero uses the same pattern as the existing Pay vault card — `bg-gradient-to-br from-[color] via-[color]/90 to-[color]/75` with white text and a radial glow overlay.

