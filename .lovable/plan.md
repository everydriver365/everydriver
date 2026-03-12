

## Plan: Update Secondary Nav Color for Ken-D Mini-Site

### Current State
- Secondary nav uses CSS variable `--secondary-nav: 160 84% 39%` (emerald green)
- Hex color `#5acad9` converts to approximately `187 63% 60%` in HSL

### Changes

**`src/index.css`**
Update the `--secondary-nav` CSS variable to the new cyan color:
- Change from `160 84% 39%` to `187 63% 60%`
- Keep `--secondary-nav-foreground` as white for contrast

This will apply the color globally. If mini-site-specific styling is needed, I can add route-based conditional logic to SecondaryNav instead.

