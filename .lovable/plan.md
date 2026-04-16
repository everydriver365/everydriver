

# Elevate the Instructor App to Premium Quality

## Problem
The app currently looks like a template due to flat coloured icon squares, repetitive horizontal scrolls, uniform shadows, and lack of visual hierarchy.

## Changes

### 1. Replace flat icon squares with SF Symbol-style roundels
- Quick Actions (4-column grid): Replace the solid-colour squares with subtle tinted backgrounds (`accent + 12% opacity`) and coloured icons instead of white-on-colour. Smaller, 48px circles instead of full squares. This matches iOS Settings/Shortcuts style.
- Tools & Features cards: Use a soft gradient (e.g. `linear-gradient(135deg, accent, accent-lighter)`) instead of flat colour. Add a subtle inner glow.

### 2. Introduce card hierarchy with 3 shadow tiers
- **Elevated** (lessons, primary actions): Multi-layer shadow with blur 24px
- **Resting** (stats, tools): Softer 2-layer shadow with blur 8px  
- **Flat** (quick actions): No shadow, just tinted background

### 3. Redesign Quick Actions as a grouped iOS list
- Instead of 4 coloured squares, use a single white rounded card with 4 rows (icon + label + chevron + badge), separated by indented dividers. This matches iOS Settings and feels immediately native.

### 4. Add visual variety between sections
- Today's Schedule: Keep horizontal scroll but make cards taller with a gradient strip instead of flat blue
- Your Business: Switch from horizontal scroll to a 2x2 grid of stat cards (they're all visible on screen anyway)
- Tools: Keep horizontal scroll but with refined icon treatment
- Insights: Use a stacked list instead of scroll (only 3 items)

### 5. Improve spacing and typography
- Increase section spacing from `mt-7` to `mt-9`
- Add letter-spacing `-0.02em` to section titles
- Use `font-weight: 600` (semibold) for card titles instead of 700 (bold) — less aggressive
- Muted subtitles at `text-[13px]` with `text-gray-400` instead of `text-gray-500`

### 6. Refine lesson cards
- Replace solid `bg-blue-500` with a gradient: `linear-gradient(135deg, #007AFF, #5856D6)`
- Add a frosted glass effect to the avatar ring
- Slightly larger card width (220px vs 200px) for more breathing room

### 7. Polish stat cards
- Add a thin top-border accent line (2px, matching the icon colour) for visual interest
- Use tabular numbers for values (`font-variant-numeric: tabular-nums`)

## Files to modify
- `src/pages/EveryInstructorHome.tsx` — All component redesigns (ImageCard, StatCard, LessonCard, Quick Actions grid, section spacing)
- `src/index.css` — Add iOS shadow tier utilities and tabular-nums class

## What stays the same
- Hero image and greeting overlay
- Bottom navigation
- All routes, data hooks, and functionality
- Overall page structure and section order

