

## Problem

The global CSS rule in `src/index.css` for `.learner-app` forces `border-radius: 0 !important` on all elements (except avatars/badges). This overrides both Tailwind classes and inline styles on child elements, so the ETG tile and its children appear square.

## Solution

Add a specific CSS exception for the ETG tile in `src/index.css`, similar to the existing `.instructor-portal` exceptions. We'll use a marker class (e.g., `etg-rounded-tile`) that opts out of the global `border-radius: 0` override.

### Changes

**`src/index.css`** — Add after the `.learner-app` rule:
```css
/* Allow rounded corners on ETG CTA tile */
.learner-app .etg-rounded-tile,
.learner-app .etg-rounded-tile * {
  border-radius: inherit !important;
}
```

**`src/components/MobileHomepage.tsx`** — Add the `etg-rounded-tile` class to the outer `motion.div` and set explicit border-radius on the outer container and its direct children:
- Outer container: keep `style={{ borderRadius: '16px' }}` + add class `etg-rounded-tile`
- Inner flex children (emerald section, card section): will inherit the rounding via CSS, with `overflow-hidden` on the parent clipping corners correctly

