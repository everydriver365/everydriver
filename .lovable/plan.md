## Goal
On whitelabel sites (e.g. Winchester), kill the large "Areas we cover" section that looks spammy on the homepage, and surface the same area links as a small, subdued strip in the footer instead — preserving internal linking to `/areas/<slug>` for local SEO.

## Changes

**1. `src/pages/Index.tsx` (lines 310–334)**
Remove the full-width `<section className="border-b border-border bg-muted/30 py-10">` block that renders the heading, intro paragraph, and chip list of areas. Leave the `getAreasForHost` import and `wlAreas` variable in place so we can pass them to the footer.

**2. Footer component (whitelabel-aware)**
Locate the site footer used on the public homepage (likely `src/components/Footer.tsx` or similar — confirm during build) and add a compact, low-visual-weight area strip rendered only when `wlConfig && wlAreas.length > 0`:

- Single line label: "Serving:" in `text-xs text-muted-foreground`
- Inline list of area names as plain text links separated by `·` (middle dot), e.g. `Winchester · Eastleigh · Alresford · …`
- Each link goes to `/areas/${areaToSlug(area)}`
- `text-xs text-muted-foreground hover:text-foreground`
- Wraps naturally; no chips, no border, no background block
- Sits above the existing copyright line

If the footer doesn't currently know about `wlConfig`, read it via the same hook/util used in `Index.tsx` so the strip appears site-wide on whitelabel domains (and stays hidden on Drive365/DSM).

## Out of scope
- `/areas/<slug>` landing pages remain unchanged
- Sitemap entries unchanged
- No mobile layout changes beyond the natural reflow of the removed section and the new tiny footer line
