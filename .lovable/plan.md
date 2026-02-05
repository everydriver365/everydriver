
## What’s happening (why you see “nothing changed”)
From your answers, you’re currently seeing the **login screen** (“Welcome Back”) on the Preview URL. On that screen, the **instructor mobile home hero is not rendered at all**.

In code, `/instructor` immediately redirects to `/instructor-app/login` when you’re not authenticated:
- `src/pages/InstructorPortal.tsx` redirects to `"/instructor-app/login"` when `!user`
- The hero you’re trying to change lives inside the **mobile dashboard** (`InstructorMobileHome -> ContextualHomeHero`), which only appears after you sign in and reach `/instructor` with a valid session **and** a mobile viewport.

So: if you’re not signed in (or your session expired), you can change the hero 100 times and it will still look unchanged because you’re not on the screen that uses it.

## Goal you confirmed
- **Full-bleed edge-to-edge for BOTH** the hero image and the glass card (not just the image).
- Mobile layout (<768px).

## Plan to fix and make the change visible

### 1) Make sure we’re testing the correct screen (no code change required)
Acceptance check:
- After signing in, your URL should be `/instructor` (dashboard), not `/instructor-app/login`.
- You should see the dashboard content (tiles, next lesson, etc.) and the hero at the top.

If you keep landing back on the login screen:
- It means the session isn’t sticking (common on mobile/PWA) or the account isn’t completing sign-in.

### 2) Implement true “full-bleed” for the hero **image + glass card**
Right now, the hero image wrapper is full-bleed via `-mx-4`, but the glass card still has `mx-4` (inset), so it will not appear edge-to-edge.

Changes (in `src/components/instructor/ContextualHomeHero.tsx`):
- Keep the hero section breakout against the parent padding:
  - `outer wrapper`: `className="relative -mx-4"`
- Make the overlapping card container full-bleed too:
  - change card wrapper from `mx-4` to `-mx-4` (or remove horizontal margins entirely and rely on the outer breakout)
- Keep the **content** nicely inset while the glass background spans edge-to-edge:
  - move padding from the glass background container to an inner content wrapper, e.g.
    - `motion.div`: full-bleed background, likely `rounded-none` (or `rounded-b-2xl` if you want some softness at the bottom only)
    - inner div: `px-4 py-4` to keep text/buttons away from edges

This produces the common “edge-to-edge sheet” look:
- background reaches the device edges
- content remains readable with consistent inset padding

### 3) Prevent “it still didn’t change” with a temporary build marker (fast, removable)
To avoid burning credits on invisible changes again, add a small temporary debug marker that’s easy to spot:
- e.g. a tiny text line in the login screen AND the dashboard: “UI build: 2026-02-05 07:xx”
- Once you confirm updates are showing, we remove it.

This immediately tells us whether:
- you’re looking at the updated build
- or you’re seeing a cached app/screen

### 4) Handle mobile/PWA caching if applicable (likely on “installed app”)
Your project uses a service worker (PWA). Installed apps can be stubborn about updates.

We’ll do two things:
1) Code-side hardening (so updates roll out more reliably):
   - adjust PWA/workbox settings to be more aggressive about taking new versions (and cleaning old caches)
2) Practical verification steps (so you can confirm instantly):
   - test in **Editor Preview** first
   - then in a normal browser tab (not installed)
   - lastly in the installed app after a full close/reopen

### 5) Test checklist (end-to-end)
On **Preview**:
- Sign in → land on `/instructor` (dashboard)
- Confirm hero **image + glass card** are edge-to-edge
- Confirm no horizontal scrolling (drag sideways test)
- Confirm other sections (tiles/stats) still have the expected padding

On **Published**:
- Publish
- Repeat the same checks in:
  - normal browser tab
  - installed app (if used)

## Notes about credits / refunds
I can’t issue refunds or adjust credits directly. If you want, I can point you to the right support channel after we confirm whether the issue was “not logged in / wrong screen” vs “caching”.

## Files involved (expected)
- `src/components/instructor/ContextualHomeHero.tsx` (full-bleed image + card implementation)
- `src/pages/instructor-app/InstructorLogin.tsx` (optional: temporary build marker)
- `src/pages/InstructorPortal.tsx` (optional: temporary build marker on dashboard)
- `vite.config.ts` (optional: PWA cache/update hardening)

## Definition of done
- After logging in (mobile width), hero banner and glass card are visibly edge-to-edge in Preview and Published.
- A build marker confirms you’re seeing the latest build.
- No horizontal scroll regressions.
