

## Problem

The ken-d instructor record in the database has explicit color values that override our code defaults:
- `website_header_bg` = `#ffffff` (white)
- `website_footer_bg` = `#18181b` (dark gray/black)
- `brand_colour` = `#dc2626` (red)

The previous changes used `|| primaryColor` as a fallback, which only applies when the DB value is null/empty. Since ken-d has values set, the fallback never fires.

## Solution

Add ken-d-specific style overrides in `MiniWebsiteLayout.tsx` (same pattern as the existing `FOOTER_CONTACT_OVERRIDES`) to force the navy blue (`#1e3a5f`) for:
- Header background
- Footer background
- Primary color (used for page hero sections)

### File: `src/components/mini-website/MiniWebsiteLayout.tsx`

Add a `STYLE_OVERRIDES` map keyed by slug, similar to the existing footer contact overrides:

```typescript
const STYLE_OVERRIDES: Record<string, { primaryColor?: string; headerBg?: string; footerBg?: string }> = {
  "ken-d": { primaryColor: "#1e3a5f", headerBg: "#1e3a5f", footerBg: "#1e3a5f" },
};
const styleOverride = STYLE_OVERRIDES[slug] || {};
```

Then apply these overrides with highest priority:
```typescript
const primaryColor = styleOverride.primaryColor || instructor.brand_colour || "#1e3a5f";
const headerBg = styleOverride.headerBg || instructor.website_header_bg || primaryColor;
const footerBg = styleOverride.footerBg || instructor.website_footer_bg || primaryColor;
```

### File: `src/pages/mini-website/MiniWebsiteHome.tsx`

The home page also uses `instructor.brand_colour` directly for `primaryColor`. Apply the same override pattern so the hero sections and headings use navy blue.

### File: `src/pages/mini-website/MiniWebsiteCourses.tsx`

Same fix — override `primaryColor` for ken-d.

### File: `src/pages/mini-website/MiniWebsiteContact.tsx` and `MiniWebsiteAbout.tsx`

Same fix in each — override `primaryColor`.

### Alternative: Update the database directly

Instead of code overrides, we could update the ken-d record in the database to set `brand_colour`, `website_header_bg`, and `website_footer_bg` all to `#1e3a5f`. This is cleaner and would immediately apply everywhere. However, the user may want the existing DB values preserved for other purposes.

**Recommended approach**: Update the database values for ken-d to the desired navy blue. This is a single SQL update and applies everywhere without touching any code files.

