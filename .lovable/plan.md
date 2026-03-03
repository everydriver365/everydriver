

## Make All Instructor Sub-Pages Match Homepage Background

### Problem
The homepage uses `wallpaperColor || "#E8F1FE"` (a light blue) as its background, but the layout only applies this on the homepage (`isHomePage && isAppStyle`). All sub-pages get plain white `bg-background`.

### Solution
In `InstructorPortalLayout.tsx`, apply the instructor's `wallpaperColor` (defaulting to `#E8F1FE`) as the background for **all** mobile instructor pages, not just the homepage.

### Changes

**`src/components/layout/InstructorPortalLayout.tsx`**:
- Remove the `isHomePage` guard from `appStyleBg` — always compute the wallpaper background for mobile views
- Apply it as an inline `style={{ backgroundColor }}` on the main container div (line ~343), falling back to `#E8F1FE` when no custom color is set
- Update the schedule page's sticky header to also inherit this background

**`src/pages/InstructorSchedule.tsx`**:
- Pass the wallpaper color through or use the `useInstructorAppearance` hook directly so the sticky header matches

### Scope
- 2 files modified, no new files
- Purely visual — no functional changes

