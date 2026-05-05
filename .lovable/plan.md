# Redesign — Instructor Dashboard (`/instructor`, desktop only)

A calm, Linear/Stripe-style SaaS dashboard. **Desktop view only** — the mobile layout (`isMobile` branch in `InstructorPortal.tsx`) is left untouched per the project's mobile-update policy.

## Scope

Replace the desktop branch of `src/pages/InstructorPortal.tsx` (lines ~241–450) and introduce a new dashboard-specific shell. The existing `InstructorPortalLayout` is kept available for all other instructor routes; the dashboard renders without it so it can own the full 3-column SaaS chrome.

## Files

New:
- `src/components/instructor/dashboardV2/DashboardShell.tsx` — page wrapper: 260px sidebar + fluid main + 280px right rail + sticky 56px top bar.
- `src/components/instructor/dashboardV2/DashboardSidebar.tsx` — 260px nav, collapsible to 64px, brand block, workspace card, 5 grouped sections, sign-out pinned bottom.
- `src/components/instructor/dashboardV2/DashboardTopBar.tsx` — breadcrumb, ⌘K search, dark toggle, notifications bell, "Ask ED" indigo pill, avatar dropdown.
- `src/components/instructor/dashboardV2/StatusStrip.tsx` — dismissible emerald "Square Connected — Auto-Payouts Active" band (state in `localStorage`).
- `src/components/instructor/dashboardV2/GreetingBlock.tsx` — H1 greeting + online toggle pill.
- `src/components/instructor/dashboardV2/StatCardV2.tsx` — label / mono number / 7-day sparkline (recharts `<LineChart>` with no axes).
- `src/components/instructor/dashboardV2/TodaySchedulePanel.tsx` — header + segmented Today/Tomorrow/Fill Gaps tabs, wrapping the existing `TodayScheduleView`, `TomorrowScheduleView`, `GapsFiller`.
- `src/components/instructor/dashboardV2/MoneyStack.tsx` — emerald "This Month" + rose "Outstanding" cards.
- `src/components/instructor/dashboardV2/RetentionAlertsPanel.tsx` — re-skin of `usePupilRetentionAlerts` data into the chip-grid spec (replaces the current `RetentionAlertsTile` on this page only).
- `src/components/instructor/dashboardV2/RightRail.tsx` — Quick Actions stack + Plan card with progress bar + indigo Upgrade button.
- `src/components/instructor/dashboardV2/tokens.css` — CSS variables scoped to `.dashboard-v2` (background, surface, border, indigo, emerald/rose/amber pairs, text scale, radii). Loaded once from the shell.

Modified:
- `src/pages/InstructorPortal.tsx` — desktop branch returns `<DashboardShell>...</DashboardShell>` composed of the new components; mobile branch unchanged. Existing data hooks (`useInstructorLiveStats`, pupils, payments, etc.) are passed down as props so no business logic changes.
- `index.html` — add Inter + JetBrains Mono Google Fonts `<link>` tags (Inter is likely already loaded; JetBrains Mono is new).
- `tailwind.config.ts` — extend `fontFamily` with `mono: ['"JetBrains Mono"', ...]` and add `tabular-nums` utility usage; no global theme changes.

## Visual tokens (scoped to `.dashboard-v2`, light + dark)

```text
--bg:        #F8FAFC   dark: #0B1120
--surface:   #FFFFFF   dark: #111827
--border:    #E2E8F0   dark: #1F2937   (always 0.5px)
--indigo:    #4F46E5
--indigo-bg: #EEF2FF   dark: #1E1B4B
--emerald-bg:#ECFDF5   --emerald-fg:#047857
--rose-bg:   #FFF1F2   --rose-fg:   #BE123C
--amber-bg:  #FEF3C7   --amber-fg:  #B45309
--text-1:    #0F172A   --text-2: #64748B   --text-3: #94A3B8
radii: 12 / 8 / 6     gaps: 12 / 16 / 24 only
```

Numbers everywhere use `font-mono tabular-nums` with `font-feature-settings: "tnum"`.

## Layout sketch

```text
┌───────────────────────────────────────────────────────────────┐
│ Top bar (56, sticky, shadow-sm)                               │
├──────────┬──────────────────────────────────────┬─────────────┤
│ Sidebar  │ Status strip (emerald, dismissible)  │             │
│ 260      │                                      │ Right rail  │
│          │ Greeting + Online toggle             │ 280         │
│ DSM logo │                                      │             │
│ KD card  │ ┌──┬──┬──┬──┐  4 stat cards          │ QUICK       │
│          │ └──┴──┴──┴──┘                        │ ACTIONS     │
│ OVERVIEW │ ┌─────────────────┬──────────┐       │ + 4 cards   │
│ TEACHING │ │ Today's schedule│ £1,840   │       │             │
│ BUSINESS │ │ (1.6fr)         ├──────────┤       │ YOUR PLAN   │
│ WEBSITE  │ │                 │ £2,875   │       │ Pro · 39/100│
│ SETTINGS │ └─────────────────┴──────────┘       │ Upgrade CTA │
│          │ Retention alerts (full-width)        │             │
│ Sign out │                                      │             │
└──────────┴──────────────────────────────────────┴─────────────┘
```

Implemented as `grid-cols-[260px_minmax(0,1fr)_280px]`, with `min-h-screen` and `overflow-x: clip`. Sidebar collapsible toggles to `grid-cols-[64px_minmax(0,1fr)_280px]`. Right rail hides below `xl` (uses 2-col layout) so the design degrades cleanly on the user's current 957px viewport.

## Data wiring

- Stats use `useInstructorLiveStats(instructorId)` already imported in `InstructorPortal.tsx` (today's lessons, month earnings, active pupils, week hours).
- Sparkline data comes from existing `useLastWeekComparison` / `useDailyEarnings` (already in repo); fall back to flat line if unavailable.
- "Outstanding" + count from existing `PaymentSummaryWidget` data hook (`usePupilPaymentStatus` aggregate already used elsewhere — reuse the query).
- Retention chips use `usePupilRetentionAlerts(instructorId)` with the new chip styling; show first 3, horizontal-scroll the rest.
- "Square Connected" strip reads the existing `useActiveTrackingProvider` / square connection flag (already used by `SquareCallback`); if Square not connected the strip is hidden.
- Plan + pupil count: `useInstructorTierConfig` + `useActivePupilsCount` (both already in `src/hooks`).

No new database tables, no new edge functions, no new API surface.

## Behaviour

- Dark mode: top-bar toggle calls existing `useTheme().toggleTheme()`; tokens above respond to `.dark` ancestor.
- Sidebar collapse state persisted in `localStorage("dsm.dashboard.sidebar")`.
- Status strip dismissal persisted in `localStorage("dsm.dashboard.squareStrip.dismissed")`.
- All hover states 150ms ease-out; nav-active uses `bg-[--indigo-bg]` + indigo text.
- Empty schedule state: gray calendar icon, encouraging copy, soft-indigo "+ Add lesson" opens the existing `AddLessonSheet`.

## Out of scope (this prompt)

- Mobile dashboard (unchanged).
- Other instructor routes (Pupils, Schedule, etc.) — sidebar links point at existing routes.
- Real "Ask ED" AI panel — button opens the existing `AICommandCenter` already imported in `InstructorPortal.tsx`.
