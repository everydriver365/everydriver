## Goal

On the instructor mobile app, all inner pages currently render edge-to-edge while the home (`/instructor`) page has a comfortable horizontal gutter (`px-4`, i.e. 16px each side). Make all inner pages match the home padding.

## Approach

Make the change in **one place** — the shared `InstructorPortalLayout` `<main>` — so every inner page gets the gutter automatically, without touching 80 page files.

### Change

In `src/components/layout/InstructorPortalLayout.tsx` (line 1121), update the inner `<main>` wrapper:

```tsx
// before
<main className={`ios-scroll ${location.pathname === '/instructor' ? '' : 'py-4'}`}>

// after
<main className={`ios-scroll ${location.pathname === '/instructor' ? '' : 'px-4 py-4'}`}>
```

Home is left untouched (it already supplies its own per-section `px-4`, so we don't double-pad it).
Fullscreen pages (map, tracking) are also untouched — they keep edge-to-edge.

### Cleanup of double-padding

About 54 of the 80 inner pages already wrap their content in their own `p-4` / `px-4` / `max-w-…` container. After the layout change, those pages would have **32px** gutters instead of 16px.

For each affected page I will:
- Remove the redundant outer `p-4` / `px-4` wrapper (keep `pb-24` for bottom-nav spacing where present).
- Preserve any `max-w-2xl mx-auto` constraint (still useful on tablet/desktop).
- Leave `InstructorPageHeader` and its spacing alone.

Examples of files in that bucket: `InstructorClockInOut.tsx`, `InstructorDocumentVault.tsx`, `InstructorCertifications.tsx`, `InstructorDailyManifest.tsx`, etc.

## Out of scope

- No changes to the home page (`/instructor`) layout.
- No changes to fullscreen routes (tracking/map/etc.).
- No changes to desktop sidebar layout, headers, bottom nav, or any business logic.
- No changes to the `/every-instructor` or pupil/parent/school portals.

## Verification

- Open `/instructor` (home) → padding unchanged.
- Open several inner pages (Pupils, Calendar, Expenses, Certifications, Clock In/Out, Document Vault, Daily Manifest) on mobile → all show the same 16px left/right gutter as home, with no doubled-up padding.
