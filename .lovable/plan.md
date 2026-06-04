## Make the hero smaller on /booking/chapmans

The orange hero lives in `src/pages/PublicBookingPortal.tsx` (lines 129–140) and is shared by every `/booking/:slug` page. It's oversized on mobile, eating most of the viewport before the search.

### Changes (one file)

`src/pages/PublicBookingPortal.tsx`, hero block only:

- Container: `py-12 px-4` → `py-6 px-4 md:py-10` (tighter vertical on mobile, modest on desktop).
- Logo: `h-12 mx-auto mb-4` → `h-9 md:h-11 mx-auto mb-2`.
- Heading: `text-3xl md:text-4xl font-bold mb-2` → `text-xl md:text-3xl font-bold mb-1` (was wrapping to two huge lines on mobile).
- Description: `text-lg opacity-90` → `text-sm md:text-base opacity-90`.

No color, copy, gradient, or layout-structure changes. Desktop stays close to current proportions; mobile becomes roughly half the height.

### Out of scope
- The search card, filter chips, and instructor grid below are untouched.
- No changes to other pages or to `Drive365SearchHeader`.
