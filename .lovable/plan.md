## Goal
Reshape the top of the pupil mobile portal header to match the Vodafone-style hero: a taller coloured band that curves/scoops down at the bottom into the page, with the existing subtle dot pattern preserved. Everything else (logo, hamburger, menu, brand colour, content below) stays exactly as it is today.

## Scope
Single file: `src/components/pupil-portal/PupilMobileHeader.tsx`

No changes to:
- Logo, title, back button, dropdown menu items or behaviour
- Brand colour resolution (`brandColour || hsl(var(--primary))`)
- Any page content under the header
- Desktop layouts
- Any other portal (instructor / admin / DSM)

## Visual change
Currently the header is a flat rectangle that ends in a straight horizontal edge. Target: the bottom edge becomes a smooth concave curve (the page "scoops" up into the red band), giving the same silhouette as the Vodafone screenshot where the white content card sits inside a curved red hero.

### Technical approach
- Keep the existing sticky wrapper, safe-area padding, decorative circles, logo row, and dropdown unchanged.
- Add ~16–20px of extra bottom padding to the coloured band so the curve has room.
- Apply the curve using a CSS mask (or an inline SVG `<svg>` positioned at the bottom of the band) that carves a shallow concave arc out of the bottom edge. Mask is preferred because it preserves the background colour, dot pattern and decorative circles without needing a second coloured layer.
- The curve should be subtle (rise ~14–18px in the middle), full-width, and use `pointer-events-none`.
- Ensure the sticky behaviour still works (mask is applied to the inner coloured div, not the sticky wrapper).

No new assets, no new dependencies.

## QA
- Verify on the current route `/p/ken-d` at 390px width that the curve renders, the logo/menu stay aligned, and the content below sits flush against the curve with no white gap or clipping.
- Confirm dark/light brand colours both render the curve correctly (mask, not overlay).
