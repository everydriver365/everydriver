

## Plan: Add Competitor Comparison + Healthcare Promo to /compare Page

### What's Changing
1. Add a "How We Compare" section showing EveryDriver vs diary app competitors (Total Drive, MyDriveTime, ADI Book) — focused on price parity and unique features
2. Healthcare showcase already exists — enhance it with a "No other diary app offers this" callout

### Code Changes

| File | Change |
|------|--------|
| `src/pages/ComparisonPage.tsx` | Add `CompetitorComparison` section between the plan matrix and the healthcare showcase |

### Competitor Comparison Section

Hardcoded responsive section with a clean card/table layout:

**Competitors shown**: Total Drive (~£24/mo), MyDriveTime (~£19/mo), ADI Book (~£16/mo)

**Features compared**:
- Starting price — EveryDriver: **From FREE** vs competitors all paid-only
- GPS route tracking — EveryDriver only
- Dashcam telematics — EveryDriver only  
- HMRC MTD tax filing (free) — EveryDriver only
- Pupil & parent apps — EveryDriver: Both, competitors: limited/none
- Professional website — All have
- Healthcare add-on available — EveryDriver only (£19.99/mo)
- No tie-in contract — All have

**Layout**: 
- Desktop: 4-column comparison grid (EveryDriver highlighted in brand colour)
- Mobile: stacked cards showing EveryDriver features vs "Others don't offer this"

**Healthcare showcase update**: Add a small tagline like "The only driving instructor app that offers healthcare benefits" to the existing section.

### No database changes needed — all competitor data is hardcoded.

