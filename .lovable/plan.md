## Why nothing visibly changed last time

- **Banner width**: At your current 1022px viewport, the banner's section padding is `8px 5% 16px` (~51px each side), and its inner `maxWidth: 1100` never kicks in because the available width is already ~920px. Lowering `maxWidth` from 1200 → 1100 had zero visual effect at this size.
- **Logo**: File `public/everydriver-logo-full.png` was replaced and `?v=20260607` was appended in `useRouteLogo.ts`. If still identical-looking, it's almost certainly browser cache — a hard refresh (Cmd/Ctrl+Shift+R) will fetch the new bytes.

## Fix for the banner

The tile grid above lives inside a parent with `padding: 1.25rem` (20px) and uses `maxWidth: 1100`. To make the banner's left/right edges line up with the tile grid edges, the banner section needs the same horizontal inset, not `5%`.

**Change in `src/pages/Index.tsx` (line 312):**

- Banner `<section>` padding: `8px 5% 16px` → `8px 1.25rem 16px`
- Inner container: keep `maxWidth: 1100, margin: "0 auto"`

This makes the banner's outer edges match the "Why book through Every Driver?" card grid's outer edges exactly at every viewport ≤ ~1140px, and identical max width above that.

## Logo

No code change needed. Hard-refresh the preview (Cmd/Ctrl+Shift+R, or DevTools → Network → Disable cache → reload). If after a hard refresh it still looks identical, the new artwork is genuinely very close to the previous version and we should re-examine the source file you intended to upload.

## Scope

- One edit, one line in `src/pages/Index.tsx`.
- No other components, no mobile changes.