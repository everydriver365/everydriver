## Problem

Two rules in `src/index.css` are forcing square corners across the app:

- **Lines 838–841**: `.learner-app *:not(...) { border-radius: 0 !important }` — strips radius from virtually every element on the homepage (which is wrapped in `.learner-app`). Only `rounded-full`, avatars, badges, and two named opt-in classes survive. This overrides Tailwind `rounded-*` classes and inline `borderRadius` styles (including the 15px instructor card change).
- **Line 567**: `--radius: 0rem;` inside the dark theme block — zeroes out shadcn's `rounded-lg/md/sm` tokens in dark mode.

## Changes

1. **Delete the `.learner-app *` blanket rule** (lines 838–847, including the now-unneeded `.etg-rounded-tile` opt-in that only existed to escape the blanket rule). Keep the `.drive365-hero-rounded` rule since it sets a specific 1.5rem value.
2. **Restore `--radius` in dark mode** — change line 567 from `--radius: 0rem;` to `--radius: 0.75rem;` to match the `:root` value.
3. **Leave alone**: the `.instructor-portal .hero-banner-no-top-radius` opt-in (line 830) and all the `--portal-radius-*` tokens — those are intentional and scoped.

## Result

- Homepage cards, badges, buttons, and the instructor cards (with the 15px radius you set) will render with their intended corners.
- Dark mode regains default shadcn radius.
- No layout, color, copy, or functionality changes.

## Files

- `src/index.css` — two edits described above.
