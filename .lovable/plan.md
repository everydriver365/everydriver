

# Desktop Sidebar Redesign — Implementation Plan

## What We're Building

Replace the current desktop instructor portal layout (navy header with tab bar + collapsible aside) with a proper Shadcn `Sidebar` component that provides a persistent, collapsible navigation experience similar to Notion or Linear.

## Current State

- `InstructorPortalLayout.tsx` (1,057 lines) handles both mobile and desktop layouts
- Desktop: navy `#142040` header with 9 horizontal nav tabs + a collapsible `<aside>` sidebar with grouped links
- Mobile: separate mobile header + bottom nav (`InstructorBottomNav.tsx`)
- Sidebar groups: TEACHING, BUSINESS, COMMUNICATION, TOOLS, VEHICLE INTELLIGENCE
- Already has `sidebarCollapsed` state and `openGroups` accordion logic
- `src/components/ui/sidebar.tsx` already exists (Shadcn sidebar primitive)

## Plan

### 1. Create `InstructorDesktopSidebar.tsx`

New component using the Shadcn `Sidebar` primitive with `collapsible="icon"`:

- Reuse existing `sidebarGroups` definition (TEACHING, BUSINESS, COMMUNICATION, TOOLS, VEHICLE INTELLIGENCE)
- Each group as a `SidebarGroup` with collapsible content
- Active route highlighting using `useLocation`
- Instructor avatar + name at the top, sign-out at the bottom
- Plan badge, notification counts on Messages/Visitor Chats items
- Icon-only mode when collapsed (tooltips on hover)

### 2. Refactor `InstructorPortalLayout.tsx` — Desktop Section

Replace the desktop return block (lines ~734–1057) to:

- Wrap in `SidebarProvider` with `min-h-screen flex w-full`
- Render `<InstructorDesktopSidebar />` on the left
- Slim header (no horizontal tab bar) — just search, notifications, theme toggle, avatar dropdown
- Keep breadcrumb bar below header
- `SidebarTrigger` in the header for collapse/expand (always visible)
- Content area as `<main className="flex-1">`

### 3. Keep Mobile Layout Untouched

The `if (isMobile)` branch (lines 376–696) stays exactly as-is. Only the desktop `else` branch changes.

### 4. Remove Redundant Desktop Nav Tabs

The `desktopNavTabs` array and horizontal tab bar in the header become unnecessary — all navigation moves to the sidebar. The header becomes a slim utility bar.

### 5. Styling

- Sidebar background: `bg-card` with `border-r`
- Header: keep `#142040` navy but slimmer, no nav tabs
- Active item: `bg-primary/10 text-primary font-medium` with left border accent
- Group labels: uppercase tracking-wide muted text
- Collapsed width: icon strip (~56px) with tooltips

## Files Changed

| File | Change |
|------|--------|
| `src/components/instructor/InstructorDesktopSidebar.tsx` | **New** — Shadcn Sidebar with grouped nav |
| `src/components/layout/InstructorPortalLayout.tsx` | Refactor desktop branch to use SidebarProvider + new sidebar |

## No Database Changes Required

This is a purely frontend layout refactor.

