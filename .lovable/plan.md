# Clone Drive365 → EveryDriver (full twin set)

Goal: produce an editable, byte-for-byte copy of every Drive365 public page under a new `everydriver/` namespace, and have `everydriver.co.uk` (plus `everydriver.co` and `everydriver.lovable.app`) automatically render that twin set instead of the Drive365 originals. Drive365 pages stay 100% untouched.

## What gets cloned

The Drive365 public surface (everything currently reachable from the Drive365 learner site):

- `Index` (home)
- `Courses`, `BookingSummary`, `BookingConfirmation`
- `Benefits`, `Intensives`, `SemiIntensive`, `Theory`
- `News`, `NewsArticle`
- `FAQs`, `Help`
- `About`, `Contact`, `Reviews`
- `FranchisePage` + `franchise/FranchiseHealthcare`, `FranchiseBonus`, `FranchiseWhatsIncluded`, `FranchiseTechnology`
- `HealthBenefitsPage`
- `ComparisonPage`

Not cloned (intentionally shared, not Drive365-specific): legal pages (Privacy/Terms/Google API), pupil portal/login, mini-website routes, school routes, accessible hub, instructor/admin/school portals, demo pages.

## File layout

```
src/pages/everydriver/
  Index.tsx
  Courses.tsx
  Benefits.tsx
  Intensives.tsx
  SemiIntensive.tsx
  Theory.tsx
  News.tsx
  NewsArticle.tsx
  FAQs.tsx
  Help.tsx
  About.tsx
  Contact.tsx
  Reviews.tsx
  FranchisePage.tsx
  HealthBenefitsPage.tsx
  ComparisonPage.tsx
  BookingSummary.tsx
  BookingConfirmation.tsx
  franchise/
    FranchiseHealthcare.tsx
    FranchiseBonus.tsx
    FranchiseWhatsIncluded.tsx
    FranchiseTechnology.tsx
```

Each file starts as a verbatim copy of its Drive365 sibling — same imports, same components, same data hooks. No behaviour change on day one. You then edit them freely without touching Drive365.

Shared building blocks (`MainLayout`, `Header`, `Footer`, `CourseTableList`, `SidebarCalendar`, `CourseCard`, hooks, `lib/`, etc.) are NOT duplicated. They keep working for both, and you only fork one when an EveryDriver page genuinely needs it to differ.

## Routing

New file `src/routes/everydriverRoutes.tsx` mirrors `publicRoutes.tsx` for the cloned set, importing from `@/pages/everydriver/*`.

In `src/App.tsx`, add a host check at the top of the `<Routes>`:

```tsx
{isEveryDriverHost() ? everydriverRoutes : publicRoutes}
{/* instructorPortalRoutes, adminRoutes, demoRoutes, schoolRoutes etc. mounted unconditionally below */}
```

`isEveryDriverHost()` (added to `src/lib/whitelabel.ts` or a tiny new helper) returns true when hostname is `everydriver.co.uk`, `www.everydriver.co.uk`, `everydriver.co`, `www.everydriver.co`, or `everydriver.lovable.app` — and false for `drive365.co.uk`, instructor subdomains, custom whitelabel domains, the accessible hosts, `bookings.drive365.co.uk`, and lovable preview URLs (which keep showing the existing instructor-marketing `HomepageRedesignDemo`).

`ConditionalHome` gets one extra branch so `/` on an EveryDriver host renders `pages/everydriver/Index` instead of falling through to `HomepageRedesignDemo`.

Portal/admin/demo/instructor-app/school/parent routes are mounted on every host as today — only the public marketing surface forks.

## Sitemap

`public/sitemap.xml` currently lists Drive365 routes. After this change, EveryDriver and Drive365 share URL paths but live on different hostnames, so no path additions are needed. The existing sitemap stays valid for both — we only need to confirm the `BASE_URL` is correct for each host (already handled by Lovable hosting per-domain).

## Day-one verification

1. Visit `everydriver.lovable.app/` → renders the cloned `everydriver/Index` (visually identical to Drive365 home).
2. Visit `drive365.co.uk/` → unchanged.
3. Click through `/courses`, `/benefits`, `/franchise`, `/about`, `/contact`, `/news` on each host and confirm both render their respective copies without errors.
4. Instructor and pupil portals still work on both hosts.

## Trade-offs you should know about

- **Maintenance doubles for cloned pages.** A bug fix in `Drive365 Benefits` won't reach `EveryDriver Benefits` unless you copy it across. This is the cost you're explicitly buying with the "full duplicate" choice.
- **Shared components stay shared.** If you want, e.g., a different course card on EveryDriver, you fork `CourseTableList` into `everydriver/CourseTableList` at that point — not now.
- **SEO:** identical content on two hostnames can cause duplicate-content issues with Google. Once you start editing the EveryDriver copies they'll diverge and this resolves itself; in the meantime you may want a `robots.txt` `Disallow` on one host or a `<link rel="canonical">` strategy. Out of scope for the clone itself — flag it after.

## Technical notes

- Cloning is mechanical: `cp src/pages/Foo.tsx src/pages/everydriver/Foo.tsx`, then update imports inside the new file only if they reference each other (most don't — they import shared components).
- Lazy imports in `everydriverRoutes.tsx` use `lazyWithRetry` exactly like `publicRoutes.tsx`.
- No DB changes, no edge function changes, no auth changes.
- `MainLayout`/`Header`/`Footer` already pick branding from `useDomainBranding`, which returns the EveryDriver brand on EveryDriver hosts — so the chrome is already correct. The clones inherit that automatically.

## Estimated size

~18 cloned page files + 1 new routes file + ~10 lines in `App.tsx` + ~10 lines in `whitelabel.ts`. No design work, no logic changes.
