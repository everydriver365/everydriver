

## Current Situation

The mini-website currently has several links that break out of the self-contained `/i/:slug` environment:

1. **SecondaryNav** (shared component) links to:
   - `/theory` — goes to the main Drive365 theory page
   - `/contact?type=bespoke` — goes to the main site contact page
   - `/contact?type=callback` — goes to the main site contact page
   - `https://everydriver.co.uk/instructor/login` — external link
   - `/pupil/login` — goes to main site pupil login

2. **MobileBottomNav** (shared component) links to `/drive365`, `/courses`, `/theory`, `/faqs`, `/help`, `/benefits` — all main site routes.

3. The mini-website layout imports `SecondaryNav` directly from the shared layout.

## What Can Be Done

Yes — we can make mini-websites fully self-contained. The approach:

### 1. Create a Mini-Website SecondaryNav
Replace the shared `SecondaryNav` import in `MiniWebsiteLayout.tsx` with a new `MiniWebsiteSecondaryNav` component that rewrites all links to stay within `/i/:slug`:
- "Theory Practice" → `/i/:slug/theory` (new page needed)
- "Bespoke Course Request" → `/i/:slug/contact?type=bespoke`
- "Request a Callback" → `/i/:slug/contact?type=callback`
- "Pupil Login" → `/i/:slug/pupil-login` or remove
- "Instructor Login" → remove entirely

### 2. Create a Mini-Website MobileBottomNav
A scoped bottom nav that links to mini-website pages only (Home, Courses, Theory, Reviews, Contact).

### 3. Create a Mini-Website Theory Page
A new `MiniWebsiteTheory.tsx` page at `/i/:slug/theory` that embeds the theory practice functionality within the mini-website layout, reusing the existing theory components.

### 4. Add Routes
Register the new `/i/:slug/theory` route in `App.tsx`.

### 5. Audit & Fix Any Remaining External Links
Scan all mini-website pages for any remaining links that navigate outside `/i/:slug` and rewrite them.

## Summary of New/Modified Files

| File | Action |
|------|--------|
| `src/components/mini-website/MiniWebsiteSecondaryNav.tsx` | Create — scoped secondary nav |
| `src/components/mini-website/MiniWebsiteMobileBottomNav.tsx` | Create — scoped mobile bottom nav |
| `src/pages/mini-website/MiniWebsiteTheory.tsx` | Create — theory page in mini-website layout |
| `src/components/mini-website/MiniWebsiteLayout.tsx` | Modify — swap SecondaryNav import, add mobile nav |
| `src/App.tsx` | Modify — add `/i/:slug/theory` route |

This makes every mini-website a fully standalone site with no external links or dependencies on Drive365 routes.

