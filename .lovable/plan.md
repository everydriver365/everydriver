
# Restore Theme Functionality to Settings Cog

## Overview

The Settings cog in the instructor mobile header will be converted from a simple navigation button to a dropdown menu that includes theme selection options (Light, Dark, OLED, System) plus a link to the Settings page. The same OLED option will also be added to the global ThemeToggle component for consistency.

---

## Changes

### 1. InstructorPortalLayout.tsx - Convert Settings Button to Dropdown

**Current behavior:** Single button that navigates to `/instructor/settings`

**New behavior:** Dropdown menu with:
- Settings page link (navigates to /instructor/settings)
- Separator
- Theme options: Light Mode, Dark Mode, OLED Dark Mode, System
- Checkmark indicator showing the active theme

**Technical changes:**
- Add imports: `DropdownMenuSeparator`, `Check`, `Monitor`, `Contrast` icons
- Get `theme` from `useTheme()` hook (already using `resolvedTheme` and `setTheme`)
- Replace the Settings `<Button>` with a `<DropdownMenu>` containing:
  - "Settings" menu item with Settings icon
  - Separator line
  - Light Mode option with Sun icon
  - Dark Mode option with Moon icon
  - OLED Dark Mode option with Contrast icon
  - System option with Monitor icon
- Each theme option shows a Check icon when it's the active selection

This applies to both mobile (line 244-252) and desktop layouts.

### 2. ThemeToggle.tsx - Add Missing OLED Option

**Current options:** Light, Dark, System

**New options:** Light, Dark, OLED Dark, System

**Technical changes:**
- Add `Contrast` icon import from lucide-react
- Add new OLED Dark Mode menu item between Dark Mode and System
- Use same styling as other menu items

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/layout/InstructorPortalLayout.tsx` | Replace Settings button with dropdown menu containing settings link + theme options |
| `src/components/ThemeToggle.tsx` | Add OLED Dark Mode option |

---

## Visual Result

The Settings cog will open a dropdown like this:

```text
┌─────────────────────┐
│ ⚙  Settings         │
├─────────────────────┤
│ ☀  Light Mode    ✓  │
│ 🌙 Dark Mode        │
│ ◐  OLED Dark Mode   │
│ 💻 System           │
└─────────────────────┘
```

The checkmark appears next to the currently active theme.
