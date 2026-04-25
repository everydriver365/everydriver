The current accessibility scaling is inconsistent because two scaling methods are mixed:

1. `html { font-size: calc(...) }` scales `rem`/Tailwind text globally.
2. `.a11y-zoom-tile { zoom: ... }` scales whole tiles separately.
3. Some tiles were then partially converted to `calc(px * scale)`, while their text remained fixed `px`.

That creates double-scaling in some places, no scaling in others, and different visual sizes between Action Needed, Next Lesson, Schedule, and Telematics.

Plan:

1. Replace tile-level `zoom` with one consistent inline-pixel scaling rule
   - Remove or disable `.a11y-zoom-tile` zoom behavior from `src/index.css`.
   - Keep global `html` rem scaling for normal Tailwind/rem UI.
   - Add a small utility approach for legacy inline `px` components: `calc(basePx * var(--a11y-text-scale))`.

2. Fix `WarmHomeTiles.tsx` completely
   - Convert Action Needed, Up Next, and Week at a Glance text sizes from raw numbers like `fontSize: 11` to scaled values.
   - Convert internal spacing, badges, chevrons, skeletons, and tile padding to the same scaled helper.
   - This ensures Action Needed changes visibly and at the same rate as its sibling tiles.

3. Apply the same rule to the other home tiles
   - `NextUpTile.tsx`
   - `HomeTodaySchedule.tsx`
   - `TelematicsTile.tsx`
   - Replace `a11y-zoom-tile` wrappers with explicit scaled sizes for the typography and key spacing.
   - Avoid scaling the whole container with CSS zoom, because that changes layout width and causes mismatched card sizes.

4. Preserve layout consistency
   - Keep card max-widths, outer margins, and grid structure stable so the dashboard does not feel like tiles are growing at different rates.
   - Scale text and touch targets, not the entire tile viewport.

5. Verify
   - Run TypeScript compile check.
   - Review the instructor home route at the mobile viewport and confirm Action Needed, Next Lesson, Schedule, and Telematics all respond consistently to Small, Default, Large, and Extra Large text settings.

Technical detail:

Use a shared pattern like:

```ts
const a11yPx = (px: number) => `calc(${px}px * var(--a11y-text-scale, 1))`;
```

Then use it consistently:

```tsx
style={{
  fontSize: a11yPx(14),
  padding: `${a11yPx(14)} ${a11yPx(16)}`,
  gap: a11yPx(12),
}}
```

This avoids mixing root rem scaling, CSS zoom, and fixed inline pixels in the same area.