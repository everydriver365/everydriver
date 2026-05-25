## Problem

On the live tracking page (`/instructor/tracking`, file `src/pages/InstructorLiveSession.tsx`), the outer wrapper uses:

```tsx
<div className="min-h-[calc(100dvh-120px)] -mx-4 md:mx-0 -mt-4 md:mt-0" ...>
  <div style={{ padding: "12px 0 96px", ... }}>
```

The `-mx-4` pulls the content 16px outside its container. Every other instructor page sits inside `InstructorPortalLayout`'s `<main>` which applies `px-2.5` (10px) horizontal gutter (line 1119 of `InstructorPortalLayout.tsx`). The negative margin overrides that gutter, so tracking-page tiles render edge-to-edge (and actually 6px past the screen edge) while the rest of the app keeps the consistent 10px inset.

## Fix

In `src/pages/InstructorLiveSession.tsx` (line ~1478), remove the negative-margin override and the inner zeroed horizontal padding so the page inherits the standard 10px gutter:

- Drop `-mx-4 md:mx-0 -mt-4 md:mt-0` from the outer wrapper.
- Change the inner inline style `padding: "12px 0 96px"` to `padding: "12px 0 96px"` unchanged (the 0 horizontal value is now correct — gutter comes from `<main>`).

That's the only edit. No layout changes, no token changes, no other pages touched.

## Out of scope

- No changes to tile radius, padding, or spacing between tiles.
- No changes to desktop layout (already correct via `md:mx-0`).
- No changes to `InstructorPortalLayout`.
