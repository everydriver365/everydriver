Root cause: a global instructor-portal CSS rule is overriding your hero radius.

What’s happening:
- In `src/index.css`, this selector applies to any instructor element whose class contains `overflow-hidden`:
  - `.instructor-portal [class*="overflow-hidden"] ... { border-radius: 20px !important; }`
- Your hero root in `src/components/instructor/HomepageHero.tsx` has `overflow-hidden`, so it gets forced to fully rounded corners.
- Your inline `borderRadius: "0 0 20px 20px"` loses because the global rule uses `!important`.

Plan to fix:
1. Update the hero root class in `HomepageHero.tsx` to include `hero-banner-no-top-radius`.
2. Keep `overflow-hidden` (needed for image clipping).
3. Remove the inline `borderRadius` override (optional cleanup), because `index.css` already defines:
   - `.instructor-portal .hero-banner-no-top-radius { border-radius: 0 0 20px 20px !important; }`
4. Verify in preview that top corners are square and bottom corners remain 20px.

Expected result:
- Top radius fully removed.
- Bottom radius preserved.
- No regression to hero image clipping.