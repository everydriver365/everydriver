

## Make Hero Image Bleed Into Header

The goal is to have the hero image extend behind the sticky header bar, creating the seamless bleed effect shown in the screenshot — where the driving scene photo flows behind the navigation icons.

### Current Structure
```text
┌─────────────────────────┐
│  Header (bg-primary)    │  ← solid opaque background
├─────────────────────────┤
│  Hero Image             │  ← separate section below
│  Greeting text          │
├─────────────────────────┤
│  Today's Overview card  │
└─────────────────────────┘
```

### Target Structure
```text
┌─────────────────────────┐
│  Header (transparent)   │  ← icons float over the image
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  Hero Image (behind)    │  ← image extends under header
│  Greeting text          │
├─────────────────────────┤
│  Today's Overview card  │
└─────────────────────────┘
```

### Changes

**1. `InstructorPortalLayout.tsx` — Make header transparent on homepage**
- On the `/instructor` route only, change the header from `bg-primary` to transparent so the hero image shows through
- Keep `bg-primary` on all other pages (back button pages)
- Remove the safe-area fill div's opaque background on homepage too
- The header remains sticky and z-40 so icons stay interactive

**2. `HomepageHero.tsx` — Extend image under the header**
- Remove the `paddingTop: env(safe-area-inset-top)` from the hero wrapper (the header already handles safe area)
- Add negative top margin to pull the hero image up behind the header area (approximately `-mt-[calc(env(safe-area-inset-top)+56px)]` to account for safe area + header height)
- Increase the hero image aspect ratio slightly (from `1/0.55` to about `1/0.65`) to compensate for the portion hidden behind the header
- Keep the greeting text positioned with enough top padding to sit below the header

**3. `InstructorPortalLayout.tsx` — Remove graduated fade on homepage**
- The existing gradient fade below the header (`linear-gradient... hsl(var(--primary))`) would look wrong over the photo — skip or change it to a subtle dark scrim on the homepage route

### Files to modify
- `src/components/layout/InstructorPortalLayout.tsx`
- `src/components/instructor/HomepageHero.tsx`

