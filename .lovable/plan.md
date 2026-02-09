

# Instructor Mobile App Personalisation

Allow instructors to customise their mobile home screen with layout style, hero image, and wallpaper colour choices.

## What You'll Get

- **Layout Style Toggle**: Choose between the current "Dashboard" style (hero + tiles + widgets) or a cleaner "Schedule" style (day-view schedule as the main focus, with a compact header)
- **Hero Image**: Upload a custom hero photo (e.g. their car, a scenic road) or choose from preset options -- replaces the default `instructor-hero.jpeg`
- **Wallpaper/Background Colour**: Pick a background tint for the home screen (currently hardcoded to `#E8F1FE` in light mode) from a set of presets or a custom colour

## Where It Lives

A new "Appearance" card in the instructor Settings page, with a mobile-friendly UI showing:
1. Layout style selector (two visual previews to tap)
2. Hero image uploader / preset gallery
3. Wallpaper colour picker (swatches)

## Technical Plan

### 1. Database: Extend `instructor_tile_preferences`

Add three new columns:

```text
home_layout_style  TEXT DEFAULT 'dashboard'   -- 'dashboard' or 'schedule'
hero_image_url     TEXT DEFAULT NULL           -- custom uploaded hero URL (stored in file storage)
wallpaper_color    TEXT DEFAULT NULL           -- hex colour override for bg, e.g. '#E8F1FE'
```

This reuses the existing table with RLS already configured, avoiding a new table.

### 2. Storage: Create a `hero-images` bucket

A public storage bucket for instructor-uploaded hero images, with RLS policies so instructors can only upload/manage their own files (using their instructor ID as folder prefix).

### 3. New Hook: `useInstructorAppearance`

A lightweight hook wrapping the three new columns from `instructor_tile_preferences`. Provides:
- `layoutStyle`: 'dashboard' | 'schedule'
- `heroImageUrl`: string | null
- `wallpaperColor`: string | null
- `updateAppearance(changes)`: saves back to database

### 4. New Component: `AppearanceSettings.tsx`

Placed inside the instructor Settings page as a new card in the grid. Contains:
- **Layout Picker**: Two tappable cards with mini preview illustrations ("Dashboard" vs "Schedule")
- **Hero Image**: Shows current image, tap to upload or pick a preset. Upload goes to file storage `hero-images/{instructor_id}/hero.jpg`
- **Wallpaper Swatches**: 6-8 preset colour circles plus a "Custom" option with a hex input

### 5. Update `InstructorMobileHome.tsx`

- Read `layoutStyle` from the appearance hook
- If `'schedule'`, render a compact header (greeting + weather) followed by `NewMobileScheduleView` instead of the full dashboard layout
- If `'dashboard'` (default), render current layout unchanged
- Apply `wallpaperColor` to the background div (replacing the hardcoded `#E8F1FE`)

### 6. Update `ContextualHomeHero.tsx`

- Accept `heroImageUrl` override from the appearance hook (already partially supported via `heroImageUrl` prop, but currently sourced from admin CMS -- this will also check the instructor's personal override first)

### Files to Create
- `src/components/instructor/AppearanceSettings.tsx` -- settings UI
- `src/hooks/useInstructorAppearance.ts` -- data hook

### Files to Modify
- `src/components/instructor/InstructorMobileHome.tsx` -- conditional layout + wallpaper
- `src/components/instructor/ContextualHomeHero.tsx` -- personal hero override
- `src/hooks/useInstructorTilePreferences.ts` -- expose new columns
- Instructor settings page (add Appearance card to the grid)
- Database migration (new columns + storage bucket)
