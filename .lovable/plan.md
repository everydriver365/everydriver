

## Promote Healthcare More Prominently Across the Platform

Healthcare is your killer differentiator — no competitor offers it. Right now it's buried at the bottom of `/compare` and exists on a separate `/health-benefits` page. Let's make it unmissable.

### What Changes

**1. Add a healthcare banner to the `/compare` hero section**
- Insert a prominent callout strip directly below the hero heading: "The only ADI app with FREE private healthcare — dental, GP, physio, mental health & cancer care included."
- Rose/warm accent styling to stand out from the pricing table.

**2. Move the Healthcare Showcase section ABOVE the competitor comparison**
- Currently the healthcare benefits grid sits at the very bottom of the page (below competitors). Move it up so visitors see it before the competitor table — reinforcing the value before they compare prices.

**3. Add healthcare callouts to each GPS+ plan column header**
- In the plan header cards (both mobile and desktop), add a small badge like "🩺 Basic Health included" on GPS + Health and "🩺 Enhanced Health + Cancer Care" on Dashcam + Health. This makes the health benefit visible without scrolling.

**4. Add a healthcare highlight row to the competitor comparison**
- Make the existing health rows more visually distinct — add a rose background tint to the "Basic Health cover" and "Enhanced Health + Cancer Care" rows so they pop against the sea of checkmarks.

**5. Add a "Learn more about healthcare" link**
- Below the healthcare showcase section, add a prominent link/button to the existing `/health-benefits` page for instructors who want the full breakdown.

### Technical Details

All changes are in `src/pages/ComparisonPage.tsx`:
- Reorder JSX sections (move healthcare showcase up)
- Add a healthcare banner component after the hero
- Add badge elements to the plan header rendering
- Add conditional row styling for healthcare feature rows in the competitor grid
- Add a "Learn more" CTA linking to `/health-benefits`

No database or schema changes needed.

