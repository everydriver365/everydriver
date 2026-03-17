

## Plan: Fix HPP iframe height for mobile + Remove "Guaranteed Earlier Test" CTA

### Problem 1: HPP iframe too tall on mobile
The Cardstream HPP iframe in `CardstreamPayButton.tsx` is hardcoded to `height: 480px; min-height: 400px`. On a 390x525 viewport, this overflows badly.

**Fix**: Reduce the iframe height on mobile to fit within the viewport. Use a responsive height — e.g. `height: 360px; min-height: 300px` — and keep the current size for desktop. We can use the `useIsMobile` hook already in the project.

**File**: `src/components/payments/CardstreamPayButton.tsx`
- Import `useIsMobile`
- Set iframe style to `height: 360px` on mobile, `480px` on desktop

### Problem 2: Remove "Guaranteed Earlier Test" CTA
The "Guaranteed Earlier Test" upsell appears as a data-driven upsell from the `booking_upsells` table via `UpsellSelector`. This is not hardcoded — it renders whatever upsells exist in the database. 

**Options**:
- **Database approach** (recommended): Disable or delete the "Guaranteed Earlier Test" upsell record in the database so it no longer appears in the booking flow.
- **Code filter**: Filter it out by name in `UpsellSelector` — not recommended as it's a data concern.

I'll run a migration or query to soft-delete/deactivate the upsell, or if there's an `active`/`enabled` column, set it to false.

### Files to change
1. `src/components/payments/CardstreamPayButton.tsx` — responsive iframe height
2. Database: deactivate the "Guaranteed Earlier Test" upsell record

