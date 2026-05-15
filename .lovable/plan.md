## Goal

Stop Drive365 surfaces from leaking users to other brands/domains, restore the Test Swap entry point in the Drive365 menu, and fix the homepage banner image whose link no longer matches its destination.

## Confirmed bugs

1. **Test Swap banner image** (`src/pages/Index.tsx` ~L590) — banner sits inside a `<Link to="/test-swap">` but the click "goes somewhere else". Two likely causes to verify and fix:
   - The `<Link>` is wrapping a `<motion.*>` block whose own onClick / nested CTA navigates first (event bubbling) — the inner CTA in that section currently routes through `/courses` search rather than `/test-swap/register`.
   - On the EveryDriver host the same banner is rendered on a different page (`MobileHomepage.tsx` L243) and points to `/test-swap` correctly, so the desktop Drive365 path is the one drifting.
2. **"Test Swap" menu item missing** — `Drive365Header.tsx` `NAV_LINKS` does include `/test-swap`, but only on the desktop top nav (≥ lg). On the current 1221px viewport the bar collapses behind the hamburger on certain widths and the link visually disappears. Confirm and ensure it's always reachable from both desktop and mobile menus, plus the footer.
3. **Cross-brand drift on `/drive365`** — On the EveryDriver host, `/drive365` currently renders the EveryDriver clone (`EDIndex`) rather than the Drive365 homepage. Per the rule "drive365 must go to drive365 nowhere else", the `/drive365` path on every host must render the Drive365 surface (`src/pages/Index.tsx` via `ConditionalHome`/explicit route), not the EveryDriver clone. Same for `/drive365/search`, `/drive365/franchise/*`.

## Changes

### 1. Banner link (Drive365 homepage)
- `src/pages/Index.tsx`: ensure the test-swap banner block (L590–L600) is a single `<Link to="/test-swap">` with no nested `<button>` / `<Link>` children. Move any inner CTA out, or change the wrapper to a plain `<a>`/`<button onClick={() => navigate('/test-swap')}>` so there's only one nav target.
- Apply the same single-link rule to `src/components/MobileHomepage.tsx` L243 and `src/pages/TestSwap.tsx` L36 (banner currently has no link — add one to `/test-swap/register` to match the user's expectation that "find a swap" goes to the registration page, per the earlier fix).

### 2. Restore Test Swap in the menu
- `src/components/layout/Drive365Header.tsx`:
  - Keep `Test Swap` in `NAV_LINKS` (already present) but also surface it in the **mobile menu** explicitly highlighted, and make sure the desktop nav's `lg:flex` breakpoint isn't hiding it on 1024–1280px viewports — switch to `md:flex` with tighter `gap` so all 6 items fit, or move `About`/`Help` into a "More" dropdown.
- `src/components/layout/Footer.tsx` already has `Test Swap` (L84) — verify it shows on Drive365 footer too.

### 3. Drive365 routing isolation
- `src/routes/everydriverRoutes.tsx`:
  - Remove the `/drive365` and `/drive365/search` routes that point to `EDIndex`/`EDCourses`. The `/drive365` URL should never render EveryDriver content.
  - Replace with explicit routes that render the Drive365 components: `<Route path="/drive365" element={<Drive365Index />} />` etc.
- `src/components/ConditionalHome.tsx`: when `pathname` starts with `/drive365`, force the Drive365 `Index` regardless of host.
- `src/components/layout/Header.tsx` L43 already routes to `Drive365Header` when `pathname.startsWith("/drive365")` — keep, and audit the rest of Header to make sure no nav link (Courses, About, Franchise, etc.) drops the `/drive365` prefix when the user is inside the Drive365 surface.

### 4. Audit pass (read-only sweep, then fix any leaks found)
Search the whole repo for these patterns and fix any that violate "Drive365 stays on Drive365":
- Absolute URLs to `everydriver.co.uk`, `everydriver.co`, `everydriver.lovable.app`, `drivingforall.co.uk`, `drivingschoolmanager.co.uk` inside `src/pages/Index.tsx`, `src/pages/drive365/**`, `src/components/homepage/**`, `src/components/layout/Drive365Header.tsx`, `src/components/MobileHomepage.tsx`.
- `window.location.href = "..."` redirects in Drive365 components — ensure they preserve host (use relative paths only).
- JSON-LD `url` fields hard-coded to `everydriver.lovable.app` on the Drive365 Index — switch to dynamic origin or `https://drive365.co.uk`.
- Footer/SecondaryNav links — verify `/drive365/franchise`, `/courses`, `/test-swap`, `/pupil/login` all stay on the same host.
- `useRouteLogo` and `getWhitelabelConfig` — make sure they don't swap brand when the path is `/drive365/*`.

### 5. QA checklist (manual)
After changes, click through on the live preview at 1221×691:
- /drive365 → Drive365 homepage, navy header, Test Swap visible in top nav.
- Click banner image → `/test-swap` (or `/test-swap/register`).
- Click every header link, every footer link, every hero CTA, every course-tile CTA, every franchise link, every promo link → confirm none redirect off the Drive365 brand.
- Repeat on EveryDriver host: `/drive365` should still render Drive365 (not EveryDriver) since the rule is brand-strict.

## Out of scope
- Mobile layout changes beyond the menu fix (per the mobile-update-policy memory rule).
- Backend / RLS / payment changes.
- New pages or design refresh.

## Files expected to change
- `src/pages/Index.tsx`
- `src/pages/TestSwap.tsx`
- `src/components/MobileHomepage.tsx`
- `src/components/layout/Drive365Header.tsx`
- `src/components/layout/Header.tsx` (audit only)
- `src/components/layout/Footer.tsx` (audit only)
- `src/components/ConditionalHome.tsx`
- `src/routes/everydriverRoutes.tsx`
