
The user wants Drive365 Accessible to feel like its own product: custom domain + distinct design system, separate from Drive365 (learners) and EveryDriver (instructors).

Looking at `DomainRouter.tsx`, the project already supports multiple domains via hostname routing. I'll mirror that pattern for a third brand without splitting the codebase.

## Plan: Drive365 Accessible — own domain + own design

### 1. Custom domain
- User connects a domain (suggested: `drive365accessible.co.uk`, `accessibledriving.co.uk`, or any they own) via **Project Settings → Domains** (Lovable handles SSL + DNS).
- Add the domain to `DomainRouter.tsx`:
  - New constant `ACCESSIBLE_DOMAINS`
  - On that domain, root `/` renders `AccessibleHome` (via `ConditionalHome`)
  - Only `/accessible/*` routes are allowed; everything else redirects to `drive365.co.uk`
  - From `drive365.co.uk` and `everydriver.co.uk`, any `/accessible/*` hit redirects to the new domain
- `useDomainBranding.ts` extended with an `isAccessibleDomain()` branch returning Accessible brand + logo.

### 2. Separate design system (scoped, no leakage)
Create a dedicated visual language under a `.accessible-portal` scope class wrapping every `/accessible/*` page (same pattern as `.instructor-portal` per memory).

**Design direction — high-contrast, calm, accessibility-first:**
- Palette: deep teal `#0E5C5C` primary, warm amber `#F4A300` accent, soft cream `#FBF7F0` background, ink `#0F1A1A` text
- WCAG AAA contrast targets, large hit areas (min 48px), focus rings always visible
- Type: larger base (18px), generous line-height (1.6), system-ui + Atkinson Hyperlegible fallback (dyslexia-friendly)
- Components: rounded-3xl cards, soft shadows, no dark-mode flip (single calm theme), supports user-toggleable high-contrast and larger-text modes
- Iconography: outlined, 2px stroke, never decorative-only — every icon has a label
- Motion: respects `prefers-reduced-motion`, no autoplay, no parallax

**Tokens** added to `index.css` under `.accessible-portal { --acc-bg, --acc-surface, --acc-primary, --acc-accent, --acc-ink, --acc-muted, --acc-ring }` plus `.accessible-portal.high-contrast` and `.accessible-portal.large-text` modifiers.

### 3. Shared `AccessibleLayout`
- New `src/components/accessible/AccessibleLayout.tsx` wraps every Accessible page
- Own header (logo, nav: Instructors / Forum / Garages / Trackers, Sign in)
- Own footer (Drive365 Accessible, accessibility statement, contact)
- Top toolbar: text-size toggle (A / A+ / A++), high-contrast toggle, persists to localStorage
- Replaces `MainLayout` usage on the 7 Accessible pages

### 4. Files

**Edited**
- `src/components/DomainRouter.tsx` — add `ACCESSIBLE_DOMAINS`, route logic
- `src/components/ConditionalHome.tsx` — render `AccessibleHome` on accessible domain
- `src/hooks/useDomainBranding.ts` — accessible branding branch
- `src/index.css` — `.accessible-portal` token block + a11y modifiers
- The 7 `src/pages/accessible/*.tsx` pages — swap `MainLayout` for `AccessibleLayout`

**New**
- `src/components/accessible/AccessibleLayout.tsx`
- `src/components/accessible/AccessibleHeader.tsx`
- `src/components/accessible/AccessibleFooter.tsx`
- `src/components/accessible/AccessibilityToolbar.tsx` (text size + contrast toggles)
- `public/accessible-logo.png` placeholder reference (user can supply)

### Out of scope
- Buying the domain itself (user does this in Project Settings → Domains)
- Logo asset creation
- Native mobile app

### Verification
- Visit new domain root → Accessible landing renders with new design
- Toggle high-contrast + large-text → persists across reloads
- Visit `/courses` on accessible domain → redirects to drive365.co.uk
- Visit `/accessible` on drive365.co.uk → redirects to accessible domain
- All 7 Accessible pages share header/footer/toolbar with no Drive365 chrome bleeding in

### Question
Which domain do you want to use? I can wire up routing for any of these:
- `drive365accessible.co.uk` (closest to current brand)
- `accessibledriving.co.uk`
- a different one you already own

Tell me the domain and I'll proceed.
