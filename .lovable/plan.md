

## Unified Settings Hub — iOS-style category navigation

### Problem
Settings are crammed into a single 1335-line scrollable page with 7 collapsible categories and 35+ nested collapsible tiles. On a 390px mobile screen this means:
- Endless vertical scrolling
- Hard to find specific settings
- Opening one tile pushes others off-screen
- No clear sense of where you are

### Solution
Replace the single monolithic page with an **iOS Settings-style two-level navigation**:

```text
Level 1: Settings Hub               Level 2: Category Page
┌──────────────────────────┐        ┌──────────────────────────┐
│  ← Settings              │        │  ← Settings    Profile   │
├──────────────────────────┤        ├──────────────────────────┤
│  🔍 Search settings...   │        │                          │
├──────────────────────────┤        │  ┌────────────────────┐  │
│                          │        │  │ 👤 Profile          │  │
│  ┌────────────────────┐  │        │  │────────────────────│  │
│  │ 👁 Listed on Website│  │        │  │ 🚗 Vehicle & Quals  │  │
│  │ 🎤 Hey ED          │  │        │  │────────────────────│  │
│  └────────────────────┘  │        │  │ 🖼 Images & Media   │  │
│                          │        │  └────────────────────┘  │
│  PROFILE & IDENTITY    > │        │                          │
│  COMPLIANCE & TEACHING > │        │  Each row expands inline │
│  COURSES & PAYMENTS    > │        │  as today (collapsible)  │
│  WEBSITE & BRANDING    > │        │                          │
│  SCHEDULING            > │        └──────────────────────────┘
│  TRACKING & ROUTES     > │
│  PREFERENCES & DATA    > │
│                          │
└──────────────────────────┘
```

**Level 1** (Settings Hub) shows the search bar, quick toggles (visibility, Hey ED), and 7 tappable category rows — each navigates to Level 2.

**Level 2** (Category Page) shows only that category's tiles with the existing collapsible expand behaviour. The back button returns to Level 1.

### Key benefits
- Each screen has at most 5-8 items instead of 35+
- Search still works globally (navigates to the right category page and opens the tile)
- Matches iOS Settings app mental model exactly
- Retains every single existing setting and feature

### Files to change

| File | What |
|------|------|
| `src/pages/InstructorSettings.tsx` | Strip down to Level 1 hub: search bar, quick toggles, 7 category navigation rows. Remove all tile content from this file. |
| `src/pages/InstructorSettingsCategory.tsx` | **New file.** Level 2 page receiving `categoryId` as route param. Renders only that category's `SettingsTile` components (moved from the monolith). |
| `src/routes/instructorPortalRoutes.tsx` | Add route `/instructor/settings/:categoryId` → `InstructorSettingsCategory` |
| `src/routes/everyInstructorRoutes.tsx` | Add matching route for Every Instructor portal |

### Implementation detail
- The `SettingsTile` component and all category content (profile form, working hours editor, etc.) move into `InstructorSettingsCategory.tsx` with a switch on `categoryId`
- Search `onSelect` calls `navigate(`/instructor/settings/${categoryId}?open=${itemId}`)` — the category page reads the query param and auto-opens that tile
- Quick toggles (visibility, Hey ED, feature toggles) stay on Level 1 since they're frequently accessed
- Desktop (>768px) can optionally show a sidebar + content split, but mobile gets the two-level nav

