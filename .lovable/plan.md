## Issue

The desktop "Choose the route that fits your life." section in `src/components/home/Drive365Home.tsx` (lines 554–710) renders much heavier than every other section on the homepage. Visual audit:

| Element | This section | Rest of page (FAQ, News & tips, All-in-one) |
| --- | --- | --- |
| Section heading | 28px, weight 800, letter-spacing -0.8px | ~20px, weight 500–600 |
| Eyebrow | White pill with border, dot, shadow, 9px weight 800 | Plain red 11px uppercase text |
| Card title | 15px / weight 800 | 13–14px / weight 500 |
| Price | 22px / weight 800 | n/a — nothing else this heavy |
| Button label | 12px / weight 800 | 12–13px / weight 500–600 |
| Pill links (Klarna/Clearpay, lane number) | weight 900 | weight 600–700 |

Net effect: the section reads as the loudest thing on the page, breaking hierarchy.

## Fix — single file, visual only

Edit `src/components/home/Drive365Home.tsx` desktop block (lines ~555–710). Do **not** touch the mobile section above it, copy, structure, colors, layout, images, CTAs, links, or hover behaviour.

**Section header**
- Replace the white-pill eyebrow with the same eyebrow used elsewhere: plain text "THREE ROUTES · ONE LICENCE", color `#D12E2E`, 11px, weight 700, uppercase, letter-spacing 1.2px. Remove the dot/border/shadow.
- Heading: `28px / 800 / -0.8px` → `20px / 500 / -0.2px`, color stays `#0A1936`. Keep the orange "route" span but match the new weight.
- Subhead paragraph: keep 13px, color `#5A6B82`.
- "Compare all routes" pill: drop the navy background; render as a `#0070C0` 13px / weight 500 text link with chevron, matching "View all articles →" style. Remove "Not sure?" sibling label.

**Cards (all three)**
- Border radius 12 → keep. Reduce border to `0.5px solid #E5E7EB`. Remove `boxShadow` entirely. Keep the featured card's `2px` accent border and translateY lift, but drop its glow shadow (use a flat 1px ring of the accent if needed).
- "Most popular" badge: 8/900 → 10/600.
- Lane number chip (01/02/03): weight 900 → 700, border opacity unchanged.
- Category eyebrow ("FAST TRACK" etc.): 8/800 → 10/600, letter-spacing 1.2px kept.
- Card title (`Intensive Courses` etc.): 15/800 → 14/500.
- Tagline ("Pass in 1–2 weeks"): 12/700 → 12/500, color `#0A1936`.
- Price block: `£1,299` 22/800 → 18/600, letter-spacing -0.4px. "From" stays 10/500. Unit "/hour" stays 11/500.
- Feature list rows: 12/500 → 12/400, color `#374151` kept. Check icon background stays.
- Spread-cost row: shrink chip text from 9/600 to 10/500; Klarna/Clearpay pill text 8/900 → 9/700 (brand-mandated pill backgrounds untouched).
- CTA button: 12/800 → 13/500, padding 10×14 → 10×14 kept, drop the colored drop-shadow (`boxShadow: none`), keep navy / accent fill and hover translate.

**Reassurance footer row**
- Already 11/600 — fine, leave as-is.

## Out of scope
- Mobile layout (`<section className="md:hidden">` above it) per project's mobile update policy.
- Any other homepage section, colors, copy, images, links, or animation timings.
- Tailwind tokens / index.css — colors are inline hex on this section; keep that pattern.
