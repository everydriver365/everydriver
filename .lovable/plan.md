# Conditional BNPL badges on course cards

Today every course card unconditionally shows both the Klarna and Clearpay instalment badges via `CompactPaymentBadges`. We'll make each badge respect the instructor's (and where relevant, the school's) BNPL toggles — `klarna_enabled` / `clearpay_enabled` — that already exist in the database and Settings UI.

## Behaviour

- Klarna badge renders only when that owner has `klarna_enabled = true`.
- Clearpay badge renders only when that owner has `clearpay_enabled = true`.
- Both off → badges row is hidden entirely (no empty gap).
- Both on → unchanged from today.

## Changes (frontend only)

1. **`src/components/payments/PaymentMessaging.tsx` — `CompactPaymentBadges`**
   - Add optional props `klarnaEnabled?: boolean` and `clearpayEnabled?: boolean` (default `true` for backwards compatibility).
   - Conditionally render each badge; return `null` when both are off.

2. **`src/components/IOSCourseCard.tsx`**
   - Accept `klarna_enabled` / `clearpay_enabled` on the `instructor` prop type.
   - Pass them through to `CompactPaymentBadges`.

3. **`src/components/DynamicCourseCard.tsx`, `src/components/courses/MobileCourseCard.tsx`, `src/components/mini-website/MiniWebsiteCourseCard.tsx`**
   - Same: read flags from the instructor (and/or school for the mini-website variant) and forward them to `CompactPaymentBadges`.
   - For mini-website cards owned by a school: prefer the school's flags if present, otherwise fall back to the instructor's.

4. **Data fetching**
   - Audit the queries that feed each card (e.g. `useFeaturedCourses`, instructor list queries on `Index.tsx`, mini-website course query) and add `klarna_enabled, clearpay_enabled` to the selected columns where missing. No schema changes required — these columns already exist on `instructors` and `schools`.

5. **`src/pages/DemoMiniWebsiteCourseCards.tsx`**
   - Wire the demo's mock instructor to the same props so the demo reflects the real behaviour.

## Out of scope

- No DB migrations, no edge-function changes.
- No changes to the larger `PaymentBadges` (full size) component used in checkout — that one already gates on health/availability.
- No changes to the BNPL toggle UI itself; we only consume the existing flags.

## Verification

- Toggle Klarna off in Instructor → Settings → Payment Options and confirm both Klarna and Clearpay badges update on home, search, and mini-website course cards.
- Toggle both off → badges row disappears, layout still spaces correctly.
- Toggle both back on → both badges return.
