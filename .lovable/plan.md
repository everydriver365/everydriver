
# Add Appearance Options to Settings Cog

Add three new menu items to the existing settings dropdown in the instructor mobile header: **Wallpaper**, **Hero Image**, and **Screen Layout**. Each will open a bottom sheet or navigate to the relevant section of the settings page.

## Changes

### File: `src/components/instructor/InstructorMobileHeader.tsx`

Add three new `DropdownMenuItem` entries between the theme toggle and the logout separator:

- **Wallpaper** (Palette icon) -- navigates to `/instructor/settings#appearance` or opens a sheet with the wallpaper colour picker
- **Hero Image** (Image icon) -- navigates to `/instructor/settings#appearance` or opens a sheet with the hero uploader
- **Screen Layout** (LayoutGrid icon) -- navigates to `/instructor/settings#appearance` or opens a sheet with the layout picker

Since the `AppearanceSettings` component already exists and handles all three features, the simplest approach is to embed it in a Dialog/Sheet that opens directly from the header, giving quick access without leaving the current page.

### Implementation Detail

1. Import `AppearanceSettings` component, `Dialog`/`Sheet` UI primitives, and icons (`Palette`, `ImageIcon`, `LayoutGrid`).
2. Add three state variables (`wallpaperSheetOpen`, `heroSheetOpen`, `layoutSheetOpen`) to control individual sheets -- or a single state with a discriminator for which section to show.
3. Add three `DropdownMenuItem` entries in the dropdown, each opening the corresponding sheet.
4. Render three small `Sheet` components (or one with conditional content) that wrap the relevant portion of `AppearanceSettings`.
5. Pass `instructor?.id` from `useInstructorAuth()` (already available in the component) to the appearance settings.

Alternatively, for simplicity, use a single sheet that shows the full `AppearanceSettings` component, triggered by any of the three menu items (scrolled to the relevant section). This avoids splitting the component and keeps things maintainable.
