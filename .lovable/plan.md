

# Remove All Remaining Border Radius from Instructor Mobile App Tiles

## Problem
Multiple homepage and dashboard tiles still have `rounded-xl`, `rounded-2xl`, `rounded-[20px]`, `rounded-[22px]`, `rounded-[14px]`, `rounded-lg`, `rounded-md`, and `rounded-t-lg` classes on their elements. These need to be replaced with `rounded-none` to match the sharp-edged design.

## Files to Update

### 1. `src/components/instructor/HomeTodaySchedule.tsx`
- Line 20: `rounded-xl` → `rounded-none` (loading skeleton card)
- Line 44: `rounded-xl` → `rounded-none` (main schedule card)
- Line 76: `rounded-lg` → `rounded-none` (empty-state icon container)

### 2. `src/components/instructor/InsightTilesGrid.tsx`
- Line 70: `rounded-[20px]` → `rounded-none` (tile buttons)

### 3. `src/components/instructor/BottomPromoGroup.tsx`
- Line 13: `rounded-xl` → `rounded-none` (outer container)
- Lines 19, 31: `rounded-lg` → `rounded-none` (icon containers)

### 4. `src/components/instructor/BestMateHomeView.tsx`
- Lines 66, 98: `rounded-[20px]` → `rounded-none` (tile containers)
- Line 188: `rounded-[14px]` → `rounded-none` (inner section)

### 5. `src/components/instructor/NextLessonTile.tsx`
- Line 108: `rounded-[22px]` → `rounded-none` (loading skeleton)
- Line 115: `rounded-xl` → `rounded-none` (inner skeleton block)

### 6. `src/components/instructor/dashboard/UnifiedAgendaTile.tsx`
- Line 185: `rounded-2xl` → `rounded-none` (outer container)
- Lines 192, 258, 262, 271: `rounded-xl` / `rounded-lg` / `rounded-md` → `rounded-none` (inner elements like icon containers, tab segments, toggle buttons)
- Lines 218, 225, 445, 476, 517, 520: `rounded-md` → `rounded-none` (action buttons, checkboxes)

## Approach
- Simple find-and-replace of `rounded-xl`, `rounded-2xl`, `rounded-lg`, `rounded-md`, `rounded-[Npx]` → `rounded-none` in each file
- Preserve `rounded-full` on circular badges/dots/avatars
- Preserve `rounded-none` already in place

