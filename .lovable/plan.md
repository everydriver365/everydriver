## Problem

The "massive grey gap" at the top of the instructor mobile home is **not** part of the header — it's the page area *above* the sticky header showing the body's default white/grey background. The sticky `MobileBlueHeader` paints `#F7F6F3` only from its own top edge, so anything above it (the safe-area inset on iOS, or the browser viewport area in the preview) shows the underlying `bg-background` colour.

A second contributing issue: the header currently has both `paddingTop: env(safe-area-inset-top) + 2px` and a fixed `height: env(safe-area-inset-top) + 44px`. In the preview (where `env(safe-area-inset-top)` is 0) that's fine, but the layout is fragile and on real iOS the icon row gets squeezed.

## Fix

Two small, header-only changes — nothing below "Needs your attention" is touched.

### 1. `src/components/instructor/MobileBlueHeader.tsx`
- Drop the fixed `height` on the inner row. Let `paddingTop: env(safe-area-inset-top) + 6px` and `paddingBottom: 6px` size it naturally to ~44–50px.
- Add an absolutely-positioned filler block behind the safe-area inset so the notch zone is also `#F7F6F3` (belt-and-braces on real devices).

### 2. `src/components/layout/InstructorPortalLayout.tsx`
- On the wrapper that has `instructor-shell-bg`, also set the page background colour explicitly via inline style on the outermost div so the body shows the same `#F7F6F3` regardless of the global `bg-background` token. Simplest path: add `style={{ background: "#F7F6F3" }}` to the wrapper div at line 482, OR add a one-line CSS rule that paints `body` the shell colour while inside `.ios-instructor`.

Pick the CSS-rule approach — cleaner and only affects the instructor mobile shell:
- In `src/index.css`, add a rule near the existing `.instructor-shell-bg` block that paints `html, body` `#F7F6F3` when the `.ios-instructor` shell is mounted. Use `:has(.ios-instructor)` on `body` so it's auto-scoped.

## Result

- No grey strip above the DSM logo.
- Header stays compact (~46px content height + safe-area).
- Background flows seamlessly from notch → header → page content.

## Files touched
- `src/components/instructor/MobileBlueHeader.tsx` (header padding/height tidy)
- `src/index.css` (single rule to paint body `#F7F6F3` while instructor shell is mounted)
