
## Goal

Apply the new premium light SaaS palette globally to the Drive365 public website by updating CSS design tokens only. No layout, content, route, form, or component structure changes.

## Why tokens (and not component edits)

The Drive365 public site already consumes semantic tokens (`bg-background`, `text-foreground`, `bg-primary`, `border-border`, etc.) defined in `src/index.css` `:root`. Updating those tokens recolours every page, card, button, border, and text style in one place — exactly the user's intent ("only update the colour system… keep layout exactly as it is").

The instructor portal, DSM admin, accessible portal, and learner-app each have their own scoped token blocks (`.instructor-portal`, `.dsm-instructor`, `.accessible-portal`, `.learner-app`) that override `--background`, `--primary`, etc. inside their shells — so those portals will NOT be affected by changes to `:root`. This keeps the redesign correctly scoped to the Drive365 marketing/learner pages.

## Files changed

Single file: **`src/index.css`** — the `:root` block (lines ~12–131) and the high-contrast override (line ~1310).

No other files touched. No components, no pages, no routes.

## Token mapping (hex → HSL)

Base surfaces / text:
```
--background       240 9% 97%    /* #F6F6F8 page bg */
--card             0 0% 100%     /* #FFFFFF */
--popover          0 0% 100%
--foreground       230 31% 14%   /* #191C2F headings */
--card-foreground  230 31% 14%
--secondary        218 21% 24%   /* #2F3748 subheadings */
--muted            240 7% 95%    /* #F2F2F4 soft panel */
--muted-foreground 232 20% 40%   /* #51567A body text */
--border           312 7% 91%    /* #E9E5E8 */
--input            312 7% 91%
```

Primary / accent:
```
--primary             230 67% 55%   /* #3E57D9 CTA blue */
--primary-foreground  0 0% 100%
--ring                230 67% 55%
--accent              214 92% 97%   /* #EEF4FE very pale blue panel */
--accent-foreground   225 44% 24%   /* #223058 dark navy */
```

Status:
```
--success          142 71% 38%   /* green for passed/paid/included */
--warning          33 87% 67%    /* #F5B563 */
--destructive      0 75% 52%     /* #E02828 */
```

Brand-specific additions (new tokens used sparingly):
```
--brand-navy       225 44% 24%   /* #223058 */
--brand-muted-icon 226 9% 69%    /* #A8ABB8 */
--brand-panel-soft 215 84% 92%   /* #DBE9FB */
--brand-panel-mid  215 86% 94%   /* #E2EDFC */
--brand-panel-pale 214 92% 97%   /* #EEF4FE */
--brand-purple     248 82% 69%   /* #7C6CF2 */
--brand-teal       185 79% 44%   /* #18B8C7 */
```

Nav / sidebar / hero gradients also retuned to the new palette (kept structure, only colour values change):
- `--nav-background` → `225 44% 24%` (#223058 dark navy)
- `--sidebar-*` aligned to new tokens
- `--gradient-hero` from navy → primary blue (soft, not harsh)
- Shadows softened (lighter alpha) for the "calm" iOS feel
- `--radius` stays at current value (no layout shift)

## What is NOT changed

- No page structure or layout
- No content, copy, hero/section ordering, images, or form fields
- No route or component changes
- Portals (`.instructor-portal`, `.dsm-instructor`, `.accessible-portal`, `.learner-app`) remain on their own scoped tokens — untouched
- Tailwind config unchanged (it already references the CSS variables)
- No new sections, no removed sections
- Status colour semantics (green=success, amber=warning, red=destructive, blue=primary) unchanged

## Verification

After applying, spot-check these Drive365 routes in the preview:
1. `/` (Drive365 learner homepage / Index)
2. `/drive365/franchise` (FranchisePage)
3. `/courses?postcode=WD171AA` (current route)
4. `/about`, `/faqs`, `/contact`
5. One instructor portal route (e.g. `/instructor`) — confirm it is **visually unchanged** (proves scoping is correct)

Build will run automatically; no manual test commands needed.
