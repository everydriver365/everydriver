

# Plan: Redesign Instructor Desktop Portal to Match Reference Design

## Overview

The reference image shows a clean, professional dashboard layout with:
- A simplified left sidebar with logo at top and user profile at bottom
- Simple text navigation links with icons (no heavy styling on active states)
- Large, bold page title in the main content area
- Content organized in categorized card sections (e.g., "Business", "Scheduling & Booking")
- Two-column grid layout for settings-style cards with icons, titles, and descriptions
- Clean white/light background with subtle borders

## Current State Analysis

The current instructor portal layout (`InstructorPortalLayout.tsx`) has:
- Fixed 256px (w-64) sidebar with avatar at top
- Active navigation items use a solid primary background (too heavy)
- Breadcrumb bar below the header
- Main content in a container with 6xl max-width

## Design Changes

### 1. Sidebar Redesign

| Element | Current | New (Matching Reference) |
|---------|---------|--------------------------|
| Logo | Avatar + user info at top | EveryDriver logo at top, user at bottom |
| Nav items | Rounded with heavy active background | Simple text links, minimal styling |
| Active state | `bg-primary text-primary-foreground` | Light left border accent, subtle text highlight |
| Spacing | Compact (py-2.5) | More breathing room |
| User profile | At top | At bottom of sidebar |
| Width | 256px | Keep similar (~240-256px) |

### 2. Main Content Area

| Element | Current | New |
|---------|---------|-----|
| Breadcrumb | Small breadcrumb bar | Remove or simplify |
| Page titles | Varies by page | Large, bold title (text-3xl font-bold) |
| Background | bg-background | Lighter (bg-muted/30 or similar) |
| Container | max-w-6xl centered | Full width with padding |

### 3. Card-Based Content Layout (for pages like Settings, Dashboard)

Create reusable components for the categorized card layout seen in the reference:
- Section headers (e.g., "Business", "Scheduling & Booking")
- Two-column grid of navigation/action cards
- Each card has: colored icon, title, description, chevron indicator

---

## Technical Implementation

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/InstructorPortalLayout.tsx` | Redesign desktop sidebar and main content wrapper |
| `src/pages/InstructorPortal.tsx` | Update dashboard layout for desktop |
| Create `src/components/instructor/DesktopNavigationCard.tsx` | Reusable card component for nav tiles |
| Create `src/components/instructor/DesktopSectionLayout.tsx` | Layout wrapper for categorized card sections |

### Sidebar Changes (InstructorPortalLayout.tsx)

```text
Current Structure:
├── Sidebar Header (avatar + user info)
├── Navigation (scrollable)
└── Sidebar Footer (sign out)

New Structure:
├── Sidebar Header (logo only)
├── Navigation (scrollable, simplified styling)
└── Sidebar Footer (user profile + sign out)
```

**Navigation Link Styling:**
- Remove heavy background on active items
- Add subtle left border indicator (2-3px primary color)
- Use muted foreground for inactive, foreground for active
- Keep icons but make them slightly more muted

### New Card Component Pattern

For settings-style pages, create a consistent card pattern:

```text
DesktopNavigationCard
├── Left: Colored icon in rounded container (40x40px)
├── Center: Title (font-medium) + Description (text-muted-foreground)
└── Right: Chevron indicator (optional)
```

Icon colors should match the reference (teal, yellow-green, etc.):
- Profile: Blue
- Billing: Red/Warning
- Business Details: Teal
- Availability: Yellow-green
- etc.

### Dashboard Page Updates (InstructorPortal.tsx)

The current dashboard already has a good structure with:
- Welcome section
- Stats grid
- Schedule tabs
- Quick actions sidebar

Updates needed:
- Increase page title size
- Adjust spacing to match cleaner aesthetic
- Ensure cards use consistent border styling

---

## Visual Specifications

### Typography
- Page title: `text-2xl md:text-3xl font-bold`
- Section headers: `text-lg font-semibold`
- Card titles: `text-sm font-medium`
- Card descriptions: `text-xs text-muted-foreground`

### Colors
- Background: `bg-background` (main) / `bg-muted/20` (secondary areas)
- Sidebar: `bg-card` with right border
- Active nav: `text-foreground` with `border-l-2 border-primary`
- Card icons: Various accent colors in light background containers

### Spacing
- Sidebar padding: `p-4` for header/footer, `p-2` for nav items
- Main content padding: `p-6 md:p-8`
- Card grid gap: `gap-4`

---

## Implementation Order

1. **Update sidebar structure** - Move user profile to bottom, simplify nav styling
2. **Refine navigation link styles** - Lighter active states, left border accent
3. **Update main content wrapper** - Larger title area, cleaner background
4. **Create reusable card components** - For consistent card-based layouts
5. **Update dashboard page** - Apply new patterns to the main dashboard

---

## Mobile Considerations

These changes are **desktop-only**. The mobile layout already has its own optimized design and will remain unchanged. The `isMobile` conditional rendering in `InstructorPortalLayout.tsx` ensures mobile users continue to see the mobile-specific layout.

