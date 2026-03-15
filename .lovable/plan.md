

# Dashboard Layout & Navigation UX Improvements

Based on auditing the current admin and instructor dashboards and comparing with patterns from MyDriveTime, Learnr, and modern SaaS admin UX best practices (task-centric design, escalation cues, role-aware views).

---

## Current Issues Found

### Admin Dashboard
1. **No persistent desktop sidebar** — On desktop, the admin has NO sidebar at all. Navigation is only via the overview grid cards or the mobile hamburger sheet. Every action requires returning to overview first. Competitors (Stripe Dashboard, Shopify Admin, MyDriveTime) all use a persistent collapsible sidebar on desktop.
2. **Flat overview grid is overwhelming** — 8 category groups × 4-8 links each = 40+ tiles on one scrollable page. No visual priority hierarchy. The "Communications" section with live badge counts is buried at the same visual weight as "Engagement & Rewards."
3. **No notification/action center in the header** — Only a search box and logout button. No bell icon, no pending-action count, no quick-jump to items needing attention.
4. **Breadcrumb is the only wayfinding** — Once inside a section, the only way back is the breadcrumb or browser back. No persistent context of where you are in the hierarchy.

### Instructor Dashboard
5. **Sidebar has 28 items across 5 groups** — Too many items visible at once. The "TOOLS" group alone has 7 items. MyDriveTime and Learnr use collapsible accordion groups so only the active group is expanded.
6. **No "pinned" or "favourites"** — Instructors likely use 5-6 pages daily (Dashboard, Schedule, Pupils, Messages, Pay). These should be pinnable to the top for fast access.
7. **Desktop header quick-action bar is icon-only** — 5 unlabelled icon buttons (Calendar, Users, £, MapPin, MessageSquare) with only tooltip labels. New users won't discover these. Best practice: show labels on wider screens, icons-only when sidebar is expanded.
8. **No contextual "What's happening now" widget** — The instructor dashboard exists but there's no at-a-glance "today" view showing next lesson, hours remaining, earnings today. Competitors show a "Today" card prominently.

---

## Proposed Improvements

### 1. Add Persistent Desktop Sidebar to Admin Portal
The biggest structural gap. Convert `AdminLayout` from header-only to header + collapsible sidebar (using the existing Shadcn `Sidebar` component, matching the instructor portal pattern).

- Reuse the `mobileNavGroups` data as sidebar groups
- Collapsible icon mode (matching instructor sidebar)
- Badge counts on Communications items (already computed)
- Keep the mobile hamburger sheet as-is

### 2. Admin Overview: Task-Centric "Needs Attention" Section
Replace the flat grid-first layout with a priority hierarchy:

```text
┌─────────────────────────────────────────────┐
│  NEEDS ATTENTION (red/amber items)          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │
│  │3 Enq │ │2 Chat│ │5 Pend│ │1 Comp│      │
│  └──────┘ └──────┘ └──────┘ └──────┘      │
├─────────────────────────────────────────────┤
│  STATS ROW (instructors, revenue, bookings) │
├─────────────────────────────────────────────┤
│  QUICK ACTIONS (Bespoke, Alert, Campaign)   │
├─────────────────────────────────────────────┤
│  CATEGORY GRID (existing, but below the fold│
└─────────────────────────────────────────────┘
```

Move items with non-zero badge counts into a prominent "Needs Attention" strip at the top. This is the "exception routing" pattern — surfaces only what requires action.

### 3. Admin Header: Add Notification Bell
Add a bell icon with aggregate unread count (enquiries + chats + messages + emails) that opens a dropdown with quick-jump links to each source. Matches the instructor portal pattern.

### 4. Instructor Sidebar: Collapsible Accordion Groups
Change sidebar groups from all-expanded to accordion-style: only the group containing the active page is expanded, others collapse to just the group label. Clicking a group label expands it and collapses others. Reduces visible items from 28 to ~8.

### 5. Instructor Sidebar: Pinned Favourites Section
Add a "PINNED" group at the top of the sidebar. Default pins: Dashboard, Schedule, Pupils, Messages. Users can right-click or long-press any sidebar item to pin/unpin. Store pins in `localStorage`.

### 6. Instructor Header: Labelled Quick Actions on Wide Screens
On screens > 1280px (`xl`), show text labels next to quick-action icons ("New Lesson", "New Pupil", etc.). On narrower screens, keep icon-only with tooltips.

### 7. Instructor Dashboard: "Today at a Glance" Card
Add a prominent card at the top of the instructor dashboard showing:
- Next lesson (pupil name, time, countdown)
- Lessons remaining today
- Earnings today
- Hours taught today

This is the #1 pattern across MyDriveTime, Learnr, and ADI Diary Pro.

### 8. Both Portals: Keyboard Shortcut Hints in Sidebar
Show subtle keyboard shortcut hints (e.g., `⌘1` for Dashboard, `⌘2` for Schedule) next to sidebar items when sidebar is expanded. Wire up the shortcuts globally.

---

## Implementation Order
1. **Admin desktop sidebar** (biggest structural fix, uses existing Shadcn Sidebar)
2. **Admin "Needs Attention" strip** (quick win, reorders existing data)
3. **Admin notification bell** (small component, high impact)
4. **Instructor accordion sidebar** (CSS/state change only)
5. **Instructor pinned favourites** (localStorage + small UI)
6. **Instructor "Today" card** (new component, queries existing tables)
7. **Quick action labels on xl screens** (CSS tweak)
8. **Keyboard shortcut hints** (polish)

### Files to Create/Modify
- `src/components/admin/AdminDesktopSidebar.tsx` — new, mirrors `InstructorDesktopSidebar`
- `src/components/admin/AdminLayout.tsx` — wrap with `SidebarProvider`, add sidebar on desktop
- `src/components/admin/AdminSettingsGrid.tsx` — add "Needs Attention" strip above stats
- `src/components/admin/AdminNotificationBell.tsx` — new, bell dropdown
- `src/components/instructor/InstructorDesktopSidebar.tsx` — accordion groups, pinned section
- `src/components/instructor/DesktopQuickActionBar.tsx` — conditional labels
- `src/components/instructor/TodayAtAGlance.tsx` — new dashboard card

