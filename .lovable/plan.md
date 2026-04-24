Standardize the instructor mobile app onto a single canonical font stack so every screen renders identically across iOS, Android, and desktop preview.

## Canonical stack

```
Inter, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display',
system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif
```

Inter is the loaded webfont — putting it first guarantees identical glyphs everywhere. SF Pro and system fonts remain as fallbacks for native shells where Inter isn't loaded.

## Changes

**1. `src/index.css` — make `.ios-instructor` the single source of truth**
- Replace the existing `.ios-instructor` and heading rules (lines 375–387) with a rule that applies the canonical stack to `.ios-instructor` AND every descendant (`.ios-instructor *`). This forces consistency even where legacy inline `fontFamily` styles exist.
- Add a small carve-out so `.font-mono`, `code`, `pre`, `kbd`, `samp` keep a monospace stack (postcodes, vehicle reg, codes, etc.).
- Remove the duplicated heading-only rule (no longer needed — headings inherit the same stack, weight handled via Tailwind classes).

**2. Page wrappers — drop conflicting inline `fontFamily` strings** (cosmetic cleanup; the CSS rule above already overrides them, but removing them keeps the codebase honest):
- `src/pages/InstructorNotifications.tsx`
- `src/pages/InstructorHealth.tsx`
- `src/pages/InstructorJobs.tsx`
- `src/pages/InstructorPay.tsx`
- `src/pages/InstructorPupils.tsx`
- `src/pages/InstructorAccounts.tsx`
- `src/pages/instructor/DashcamGallery.tsx`
- `src/components/instructor/InstructorInbox.tsx`
- `src/components/instructor/IOSPageWrapper.tsx`
- `src/components/instructor/InstructorMobileHome.tsx` (greeting block, line ~365)
- `src/components/instructor/IOSTile.tsx` (root + child overrides)

The hundreds of `fontFamily: "Inter, sans-serif"` declarations inside individual rows/tiles are left untouched — Inter is now the first font in the canonical stack, so they resolve identically to the new default and pose no maintenance risk. Stripping them all would touch 50+ files for zero visual change.

## Out of scope

- Emoji stack in `Emoji.tsx` and `DesktopNavigationCard.tsx` — intentional, kept as-is.
- Monospace usage (`font-mono`, postcodes, codes) — explicitly preserved.
- Desktop instructor portal — unaffected (rule is scoped to `.ios-instructor`).

## Result

Every instructor mobile screen renders Inter on all platforms. On native iOS, if Inter fails to load, SF Pro takes over seamlessly. No visible flicker between screens, no Android/desktop inconsistency.