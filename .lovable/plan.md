
## What's actually broken on Winchester

Winchester is a **standalone whitelabel site** — the full Drive365 learner site rebranded for Winchester. Every page is supposed to use `MainLayout`, which already swaps in `WhitelabelBottomNav` (Home / Courses / Theory / Reviews / Contact, neutral primary).

The break is on **Reviews** and **Contact**. In `src/components/ConditionalRoutes.tsx`, when the host is whitelabel, those two routes render the **`/i/{slug}` mini-site components** (`MiniWebsiteReviews`, `MiniWebsiteContact`). Those carry their own layout, their own bottom nav (different icons, different colours), and links pointing into the `/i/{slug}/...` mini-site path tree.

That's the symptom you're seeing: tap Reviews on Winchester → land on the small instructor mini-site Reviews page with the wrong nav and the wrong colours, and from there it bounces around the `/i/...` tree, away from the Winchester clone.

`ConditionalServices` has the same shape (returns `null` for whitelabel today). Not in the bottom nav, but latent.

## Fix — keep Winchester self-contained

Stop borrowing the `/i/{slug}` mini-site components inside whitelabel routes. Treat whitelabel hosts as plain Drive365 pages, just rebranded.

### 1. `src/components/ConditionalRoutes.tsx`
- `ConditionalContact` → on whitelabel, render the standard Drive365 `<Contact />` (it already picks up branding via `useRouteLogo` / `getWhitelabelConfig`). Only instructor **subdomains** keep using `MiniWebsiteContact`.
- `ConditionalReviews` → same: render a standard Drive365 reviews page on whitelabel, not `MiniWebsiteReviews`.

### 2. New `src/pages/Reviews.tsx`
There's no Drive365 `Reviews.tsx` today (only the mini-site version). Add a small one that:
- uses `MainLayout` (so it gets `WhitelabelBottomNav` automatically)
- pulls reviews scoped to the whitelabel instructor when present (mirrors how `Courses.tsx` already scopes itself by host)
- falls back to platform-wide reviews on bare Drive365

No new design system, no new data model — just the missing page.

### 3. Sanity sweep
Quick read of any other `Conditional*` to make sure no other route silently ships a `/i/{slug}` component into whitelabel. Anything that does gets the same treatment.

### 4. Bottom nav stays as-is
`WhitelabelBottomNav` items, icons, and neutral `bg-primary` are correct per your answer. No colour change.

## What I'm explicitly **not** touching

- `/i/{slug}` instructor-generated mini-sites — separate product, leave alone.
- DB triggers, `app_slug`, page seeding — already correct.
- Instructor portal, pupil portal, admin, mobile layouts elsewhere.
- Drive365 / EveryDriver routing on their own domains.

## Files I'll edit

- `src/components/ConditionalRoutes.tsx` — stop returning mini-site components on whitelabel.
- `src/pages/Reviews.tsx` — new lightweight Drive365 reviews page using `MainLayout`.

Two files. No DB migration. No changes to the mini-site product.
