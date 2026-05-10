## Goal

Make the Winchester Driving School mobile homepage a 1:1 clone of the Drive365 mobile homepage. The only difference allowed: the WDS logo and "Winchester Driving School" wording in the header (already wired via `useRouteLogo` + whitelabel config).

## Changes

**`src/components/MobileHomepage.tsx`** — strip all `isWinchester` branches so the page renders exactly like Drive365:

1. Remove the `isWinchester` constant and `getWhitelabelConfig` import (no longer needed here — branding still flows through `useRouteLogo`).
2. Delete the Winchester-only hero overlay (phone pill + amber "Book Now" button) at the top-right of the hero image.
3. Use the single Drive365 `navItems` list (Home → `/drive365`, Search, Theory, FAQs, Help, Benefits) for everyone — drop the Winchester variant (Home/Courses/Theory/Reviews/Contact).
4. Remove the bottom-nav fork: always render the standard Drive365 bottom nav, never `WhitelabelBottomNav`.
5. Remove any other `isWinchester ?` conditional branches (around line 381 and elsewhere) so franchise/benefits/feature sections render identically on both domains.

**No other files change.** Header, Footer, route resolution, and whitelabel data scoping (Ken D's courses/reviews/contact) all stay as-is.

## Out of scope

- Header/Footer (already show WDS logo + Winchester name + Ken D contact details).
- Whitelabel data scoping for `/courses`, `/reviews`, `/contact` (unchanged).
- The `WhitelabelBottomNav` component itself can stay in the repo for other pages that still use it.

## Verification

Open `/?whitelabel=winchesterdrivingschool.co.uk` at 440px and `/` at 440px (Drive365) side-by-side: every section, the hero, search card, polaroid stack, franchise promo, and bottom nav should be identical apart from the WDS logo + "Winchester Driving School" wording in the top header.
