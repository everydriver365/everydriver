
Root cause identified: the rounding is not coming from `HomepageHero` anymore. It is being re-applied globally by this CSS rule in `src/index.css`:

- `.instructor-portal [class*="overflow-hidden"] ... { border-radius: 20px !important; }`

Because your hero banner uses `overflow-hidden`, that global `!important` forces top corners to stay rounded.

Plan to fix:

1. Add an explicit opt-out class to the hero container in `src/components/instructor/HomepageHero.tsx`
- Example class on hero wrapper: `hero-banner-no-top-radius`

2. Update `src/index.css` so the global instructor rounding rule excludes this class
- Change selector to include `:not(.hero-banner-no-top-radius)`

3. Add a dedicated override rule for safety (also `!important`) so nothing can re-round it
- `.instructor-portal .hero-banner-no-top-radius { border-radius: 0 0 20px 20px !important; }`
- Keep `overflow-hidden` so the image still clips to the bottom corners.

4. Verify on `/instructor` with current mobile header
- Confirm top-left and top-right of hero are square
- Confirm bottom corners remain 20px rounded
- Confirm no regressions on other instructor cards/tiles

Technical note:
This is a CSS specificity conflict (`!important` global utility rule overriding component-level radius), so the fix must be done in the global stylesheet, not only inside the component.
