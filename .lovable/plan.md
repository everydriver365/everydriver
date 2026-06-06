## Goal
Swap the current EveryDriver logo (navy rectangle background) for a transparent-background PNG so it blends into any header colour.

## Steps
1. Generate a transparent version of the uploaded logo using `imagegen--edit_image` with `transparent_background: true`, saving to `public/everydriver-logo-full.png` (overwriting the current file).
2. Verify the new file is a non-zero PNG.
3. No code changes needed — every reference (`Header.tsx`, `Drive365Header.tsx`, `OnboardingLayout.tsx`, `useRouteLogo.ts`, `Index.tsx` JSON-LD) already points to `/everydriver-logo-full.png`.

## Notes
- Browser cache may need a hard refresh to see the new logo.
- If the AI-removed background introduces fringing, fall back to asking you to upload a hand-prepared transparent PNG.
