## Why the pills didn't move

The `/courses` grid renders `DynamicCourseCard`, not `CourseCard`. My previous edits all went into `CourseCard.tsx`, which isn't used on this page — so nothing changed visually. Pills (Popular / Intensive / Transmission / Distance / Discount) are still absolutely positioned over the hero image inside `DynamicCourseCard.tsx`.

## Plan

Update `src/components/DynamicCourseCard.tsx` only:

1. **Hero image** (currently `h-44 ... object-cover`):
   - Wrap in a fixed-aspect container `aspect-[4/3] bg-muted` so every card matches.
   - Switch image to `object-contain` so the full image is visible (no cropping), consistent with the prior request.
   - Remove the absolutely-positioned overlay children from inside this container.

2. **Move pills to a meta shelf below the image** (matches the previously chosen "Sub-image meta shelf" direction):
   - New row directly under the image: `flex flex-wrap items-center gap-1.5 px-4 py-2 border-b border-border/50`.
   - Move into this row: `Popular`, `Intensive / Semi-Intensive`, `Transmission` badges, plus the **Distance** chip (right-aligned via `ml-auto`).
   - Move the **Discount** ("Save £X") pill here too, styled as a red badge alongside the others (no longer floating over image).
   - Keep the **Premium "Featured"** badge where it is (top-right corner of the whole card) — it's a card-level marker, not an image overlay.

3. **No other behavioural changes**: pricing, flip, navigation, payment badges all unchanged. Back of card unchanged.

### Technical detail

- Replace lines ~150–191 (image block with overlays) with: `<div class="relative aspect-[4/3] overflow-hidden bg-muted"><img ... object-contain ... /></div>` followed by the new shelf div containing the badges.
- Keep `isPremium` Featured badge block (lines 142–148) as-is.
- No CSS token changes; reuse existing semantic classes (`bg-emerald-500`, `bg-primary`, `bg-amber-500`, `bg-white/90`, `bg-red-500`) already in the component.

That's it — single file, presentation-only.