

## Making Tiles Stand Out from the Background

Currently, the Job Offers, Messages, and other tiles use `bg-card border border-border` which can look flat against the page background, especially in light mode where the contrast is subtle.

Here are several approaches -- you can pick one or combine them:

---

### Option A: Elevated Shadows
Add a subtle shadow to give tiles a "lifted" feel, creating depth separation from the background.
- Adds `shadow-sm` or a custom shadow like `shadow-[0_2px_12px_rgba(20,37,66,0.08)]` to each tile
- Keeps the clean, minimal look but adds perceived depth
- Works well in both light and dark mode

### Option B: Gradient Background Fills
Replace the flat `bg-card` with a subtle gradient fill on each tile.
- Job Offers tile: warm amber gradient (`bg-gradient-to-r from-amber-50 to-card`)
- Messages tile: cool blue gradient (`bg-gradient-to-r from-blue-50 to-card`)
- Quick action tiles get similar treatment matching their icon color
- Dark mode variants included

### Option C: Left Accent Border
Add a colored left border stripe to each tile for a bold, app-like feel.
- Job Offers: `border-l-4 border-l-amber-500`
- Messages: `border-l-4 border-l-primary`
- Simple but effective visual anchor

### Option D: Thicker / Colored Border
Replace the subtle `border-border` with a slightly more visible or tinted border.
- e.g. `border-border/80 border-[1.5px]` for more definition
- Or color-tinted borders matching each tile's theme

### Option E: Combined (Recommended)
Use **shadow + subtle gradient** together for maximum standout:
- `shadow-[0_2px_12px_rgba(20,37,66,0.08)]` for lift
- Gentle color-tinted background matching each tile's purpose
- This matches the existing design memory for quick action tiles

---

### Technical Details

**Files to modify:**
- `src/components/instructor/InstructorMobileHome.tsx` -- update the className on the Job Offers button (~line 344) and Messages button (~line 359)
- `src/components/instructor/QuickActionTiles.tsx` -- update tile styling if quick action cards should match
- Optionally update `src/components/instructor/NextUpTile.tsx` and other card components for consistency

**Example (Option E combined):**
```
// Job Offers button
className="... bg-gradient-to-r from-amber-50 to-card dark:from-amber-950/20 dark:to-card shadow-[0_2px_12px_rgba(20,37,66,0.08)] ..."

// Messages button  
className="... bg-gradient-to-r from-blue-50 to-card dark:from-blue-950/20 dark:to-card shadow-[0_2px_12px_rgba(20,37,66,0.08)] ..."
```

Pick your preferred option (A-E) or combine elements, and I will implement it.
