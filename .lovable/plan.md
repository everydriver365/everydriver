## Scope

The desktop hero on the homepage (`src/components/home/Drive365Home.tsx`, the `.d365-hero-*` block) currently uses `border-radius: 4px` on every tile — the photo, the welcome card, the two feature tiles, the thumbnail image, and the spacer — plus `2px` on the two CTA buttons.

## Change

Bump radius on the hero tiles to **15px** (matching the instructor cards on "See who's teaching you"), and the buttons inside them to **10px** so they still feel tied to the tiles without looking like pills.

Specifically, in the `<style>` block (lines ~327–359):
- `.d365-hero-photo` → `border-radius: 15px`
- `.d365-welcome` → `border-radius: 15px`
- `.d365-feat` → `border-radius: 15px`
- `.d365-feat img` → `border-radius: 10px` (inner thumbnail)
- `.d365-feat-row-layout .d365-feat-thumb` → `border-radius: 10px`
- `.d365-spacer` → `border-radius: 15px`
- `.d365-cta` → `border-radius: 10px`
- `.d365-feat-btn` → `border-radius: 10px`

No layout, color, copy, or behavior changes. Mobile hero is untouched (the rule is desktop-only, ≥768px).

## File

- `src/components/home/Drive365Home.tsx`

If you want a different radius (e.g. 8px, 12px, 20px) say the word before I implement.
