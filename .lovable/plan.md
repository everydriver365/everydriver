

## Plan: Unify Menu + Settings into One Searchable Page

### Problem
The "More" tab shows a menu with an "All Settings" row that navigates to a separate `/instructor/settings` page. This creates an unnecessary extra tap. The user wants one long, searchable, categorized list combining everything.

### Approach
Merge the settings tiles (collapsible panels) directly into the Menu page, organized by category. Remove the separate "All Settings" navigation row. The result is a single scrollable page with:
1. **Search bar** at the top (filters across all items)
2. **Quick Actions** section (existing menu items like To Do, Messages, Jobs, etc.)
3. **Money & Reports** section (existing menu items)
4. **Schedule & Pupils** section
5. **Tools** section
6. **Resources** / **Wellbeing** sections
7. **Profile & Identity** settings (collapsible tiles from current Settings page)
8. **Compliance & Teaching** settings
9. **Courses & Payments** settings
10. **Website & Branding** settings
11. **Scheduling** settings
12. **Tracking & Routes** settings
13. **Preferences & Data** settings (includes Quick Toggles like visibility, Hey ED)
14. **Account** (Sign Out)

### File Changes

**`src/pages/InstructorMenu.tsx`**
- Import all settings tile content components (profile editor, working hours, courses manager, etc.) from InstructorSettings
- Import the `allTiles`, `categories` arrays and `renderTileContent` logic (or refactor into a shared hook/module)
- Add the Quick Toggles section (visibility, Hey ED, feature toggles) inline
- Add all settings categories with collapsible tiles after the existing menu sections
- Remove the "Settings" section that currently links to `/instructor/settings` (lines 150-157), keeping "FAQs & Help" in Resources
- Keep the search bar filtering across both menu items AND settings tiles

**`src/pages/InstructorSettings.tsx`**
- Redirect to `/instructor/menu` (or keep as-is for deep-link `/instructor/settings?open=profile` support by redirecting with params)

**`src/pages/InstructorSettingsCategory.tsx`**
- Update redirect target from `/instructor/settings` to `/instructor/menu`

### What stays the same
- All existing functionality: search, filtering, collapsible panels, profile editing, all settings components
- Navigation from menu items (schedule, pupils, etc.) works identically
- Feature gating and lock badges on menu items
- Deep links via `?open=` parameter still work

### Technical details
- Extract `allTiles`, `categories`, `renderTileContent`, and related profile-fetching logic into a shared file `src/hooks/useSettingsTiles.tsx` to avoid duplicating ~400 lines
- The Menu page will use `Collapsible` from radix for settings tiles (same pattern as current Settings page)
- Settings tiles render inline with the same iOS grouped-list card style already used in the menu

