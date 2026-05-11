## What's happening

The course tiles themselves are correct — they navigate to `/book/<instructorId>?hours=…&date=…`, which is a valid route and the live URL returns `200`:

```
HTTP/2 200
GET https://winchesterdrivingschool.co.uk/book/c98…?hours=10&date=2026-06-01
```

The 404 is a **stale-deploy + preview-redirect interaction**:

1. `src/components/CustomDomainCanonical.tsx` calls `window.location.replace("https://winchesterdrivingschool.co.uk…")` whenever the current host doesn't match the verified `custom_domain`. So as soon as the Winchester whitelabel is active in the Lovable preview (or via `?whitelabel=…`), every in-app click hard-jumps the iframe out to the **live published** site.
2. The live published site is **older than the current code**. Recent additions in this conversation that aren't deployed yet:
   - `WhitelabelAreaPage` route (`/areas/:slug`)
   - Updated `whitelabel-sitemap` edge function (already deployed) with `/areas/<slug>` URLs
   - "Areas we cover" pills now wrap in `<Link to="/areas/<slug>">`
3. So clicking a course tile that lands on `/book/...` actually works on live (200), but clicking any of the new "Areas we cover" pills → live site has no `/areas/:slug` route → catch-all `<Route path="*" element={<NotFound />}>` renders → **404**.

I want to confirm which tile you're clicking before I commit to a single fix, because the right answer is different for each:

- If it's the new town pills under "Areas we cover" (Eastleigh, Romsey, etc.) → **publish the app**. The route exists in code but not on the live domain yet.
- If it's a course card "Book Now" button → that's already working on production; I'd need a screenshot of the URL it landed on to debug further.

## Proposed steps

1. **Publish the latest build to `winchesterdrivingschool.co.uk`** so `/areas/:slug` (and the updated SEOHead `<link rel="sitemap">`) are live. This alone resolves any 404 from the new "Areas we cover" pills.
2. **Verify** each link target on the live domain returns 200 and renders correctly:
   - `/areas/eastleigh`, `/areas/romsey`, `/areas/chandlers-ford` (apostrophe slug)
   - `/courses?area=Eastleigh`
   - `/book/<instructorId>?hours=10`
3. **Smooth out the preview** so testing whitelabel changes inside Lovable doesn't silently jump the iframe to production. In `CustomDomainCanonical.tsx`, skip the `window.location.replace(...)` redirect when:
   - `currentHost.endsWith(".lovableproject.com")`, or
   - `currentHost.endsWith(".lovable.app")`, or
   - the override came from `sessionStorage["lovable_whitelabel_override"]`.
   The canonical `<link rel="canonical">` is already set unconditionally, so SEO is unaffected. This means future whitelabel testing happens against the latest preview build, not the stale published build — which would have caught this 404 immediately.
4. **(Optional)** Add a small sanity log in `WhitelabelAreaPage` when an unknown slug is hit so future area-typos are visible in console rather than silently bouncing to `/`.

## Technical details

- Files touched in step 3: `src/components/CustomDomainCanonical.tsx` only — guard the `currentHost !== canonicalHost` branch with the preview-host allow-list.
- No DB migrations.
- No new edge function deploys (whitelabel-sitemap already includes `/areas/<slug>` and was redeployed in the previous step).
- After publishing, also resubmit `https://qyqeibovdhyohkfagujv.supabase.co/functions/v1/whitelabel-sitemap?host=winchesterdrivingschool.co.uk` in Search Console so Google picks up the new area URLs.

Could you confirm which tile is 404-ing — the **town pill under "Areas we cover"** or an **actual course card "Book Now"** — and ideally paste the URL it lands on? That will let me skip step 2 verification or expand it as needed.