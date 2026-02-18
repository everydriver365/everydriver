
# Remove Border Radius from All Tiles on Learner App (Drive365)

## What changes

Add a global CSS override -- identical to the existing instructor portal pattern -- that removes border radius from all tiles, cards, and containers on the learner-facing pages. Avatars, badges, and pill-shaped elements (like rounded-full) will be excluded so they keep their circular/pill shape.

## How it works

The instructor portal already does this with a single CSS rule in `src/index.css`:

```css
.instructor-portal *:not(.rounded-full):not([class*="avatar"]):not([class*="badge"]):not([class*="Avatar"]) {
  border-radius: 0 !important;
}
```

We replicate the same approach for the learner app:

1. **Add a CSS class** `learner-app` to the `MainLayout` wrapper div (the `<div>` on line 13 of `src/components/layout/MainLayout.tsx`)
2. **Add a matching CSS rule** in `src/index.css` that strips border-radius from all descendants, excluding rounded-full elements (avatars, dot indicators, badges)

## Files to modify

| File | Change |
|---|---|
| `src/components/layout/MainLayout.tsx` | Add `learner-app` class to the outer wrapper div |
| `src/index.css` | Add `.learner-app *:not(.rounded-full)...` CSS override rule (mirrors the instructor-portal rule) |

This is a two-line change that affects every learner page globally -- no need to edit individual page files.
