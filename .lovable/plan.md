

## Why Backgrounds Haven't Changed

The CSS variable `--background` was updated to `#F4F7F6`, but that change is invisible because:

1. **Background image override**: `InstructorPortalLayout.tsx` (the main mobile layout) applies a full-page background image (`instructor-bg-signs.png`) via inline styles, which completely covers the CSS background color.

2. **Hardcoded `bg-white`**: Many instructor components use hardcoded `bg-white` or `backgroundColor: "#FFFFFF"` instead of `bg-background`. For example:
   - `InstructorMenu.tsx` line 178: search input uses `bg-white`
   - `InstructorMenu.tsx` line 209: grouped cards use `bg-white`
   - `TelematicsTile.tsx`: uses `backgroundColor: "#FFFFFF"`
   - `ActivityTilesGrid.tsx`: uses `backgroundColor: "#FFFFFF"`
   - `NextLessonCard.tsx`: uses `bg-white`
   - `EveryInstructorLayout.tsx` header: uses `bg-white/95`

### Fix

1. **`InstructorPortalLayout.tsx`** — Change the mobile background from the image to `#F4F7F6`:
   - Replace the `backgroundImage` inline style with `backgroundColor: "#F4F7F6"` (or remove the inline style entirely so `bg-background` takes effect)

2. **Bulk replace `bg-white` → `bg-card`** across instructor page components where it represents a page/section background (not decorative elements like pills or badges):
   - `InstructorMenu.tsx` — search input and grouped cards
   - `EveryInstructorLayout.tsx` — header
   - `ContextualHomeHero.tsx`, `NextLessonCard.tsx`, `TelematicsTile.tsx`, `ActivityTilesGrid.tsx`, `BestMateHomeView.tsx` — tile/card backgrounds

3. **Leave `bg-white` alone** where it's used for contrast elements inside dark containers (nav pills, badges, overlays on dark backgrounds).

This is a sweeping change across ~15+ files. The key fix is step 1 (the layout background image), which alone will make the page background `#F4F7F6`. Steps 2-3 ensure cards/tiles also respect the theme rather than being hardcoded white.

### Files Changed
- `src/components/layout/InstructorPortalLayout.tsx` — remove background image, use `#F4F7F6`
- `src/pages/InstructorMenu.tsx` — replace `bg-white` with `bg-card`
- `src/components/layout/EveryInstructorLayout.tsx` — header `bg-white/95` → `bg-background/95`
- `src/components/instructor/TelematicsTile.tsx` — `#FFFFFF` → theme-aware
- `src/components/instructor/ActivityTilesGrid.tsx` — `#FFFFFF` → theme-aware
- `src/components/instructor/BestMateHomeView.tsx` — `#FFFFFF` → theme-aware
- `src/components/instructor/NextLessonCard.tsx` — `bg-white` → `bg-card`
- `src/components/instructor/ContextualHomeHero.tsx` — if hardcoded white
- Additional instructor page files with `bg-white` page backgrounds

