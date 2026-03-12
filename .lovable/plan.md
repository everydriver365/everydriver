

## Plan: Add "Available Tests" Page to Mini-Website

### Overview
Create a new mini-website page at `/i/:slug/tests` that displays available driving test slots scraped from the DVSA system. The page will reuse the existing `fetchTestCentres` and `fetchSlotsForCentre` API functions and follow the same layout patterns as other mini-website pages.

### Changes

**1. Create new page: `src/pages/mini-website/MiniWebsiteTests.tsx`**
- Follow the same structure as `MiniWebsiteAbout.tsx` (useParams, useWebsitePage, MiniWebsiteLayout, STYLE_OVERRIDES for branding)
- Hero section with "Available Driving Tests" heading using the synchronized primary color
- Embed a public-facing version of the test slots UI:
  - Centre selector dropdown (reuse `fetchTestCentres`)
  - Slot cards per centre (reuse `fetchSlotsForCentre`)
  - Display centre name, date, and time for each slot
  - No "Reserve" button on the public mini-website (that's instructor-only); instead show a CTA like "Contact us to book this slot" linking to the contact page
- Loading/error states matching other mini-website pages

**2. Register route in `src/App.tsx`**
- Add lazy import for `MiniWebsiteTests`
- Add route: `<Route path="/i/:slug/tests" element={<MiniWebsiteTests />} />`

**3. Add "Tests" to mini-website navigation**
- **`MiniWebsiteMobileBottomNav.tsx`**: Add a "Tests" nav item (using `Calendar` or `ClipboardList` icon) pointing to `/i/${slug}/tests`
- **`MiniWebsiteSecondaryNav.tsx`**: Add a "Test Availability" link pointing to `/i/${slug}/tests`

### Technical Details
- The page will import `fetchTestCentres` and `fetchSlotsForCentre` from `@/lib/api/firecrawl` (same as the existing `AvailableTestSlots` component)
- No database changes needed -- the scrape edge function already exists
- No authentication required -- this is a public-facing page showing available slots
- The "Reserve" action will not be available on the public site; instead a contact CTA will direct visitors to the instructor's contact page
- Branding will use the same `STYLE_OVERRIDES` pattern with `primaryColor` fallback

