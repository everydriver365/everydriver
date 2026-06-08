# Fix: Instructor mobile pages rendering too narrow

## Root cause

The shared mobile root wrapper in `src/components/layout/InstructorPortalLayout.tsx` (line 1122) applies horizontal padding to every instructor route:

```tsx
<main className={`ios-scroll ${location.pathname === '/instructor' ? '' : 'px-2.5 py-4'}`} ...>
  {children}
</main>
```

That `px-2.5` (10px each side) is added to every page. Most pages then add their own wrapper with `px-4` (16px each side) on top, so every screen ends up with ~26px of padding on each side and cards never reach the screen edges.

Despite the user mentioning `max-w-*`, `w-96`, `container`, etc., a scan of `InstructorPortalLayout.tsx` shows no max-width or fixed width on the root wrapper — the only constraint is this padding. Per-page `max-w-5xl mx-auto` wrappers exist but do not constrain on a 390px viewport.

## Fix (single change)

In `src/components/layout/InstructorPortalLayout.tsx`, line 1122, drop the horizontal padding from the root `<main>` so it is true full-width (`width: 100%`, no max-width, no side padding). Keep `py-4` for vertical breathing room, and keep the `/instructor` (home) carve-out unchanged.

Before:
```tsx
<main className={`ios-scroll ${location.pathname === '/instructor' ? '' : 'px-2.5 py-4'}`} ...>
```

After:
```tsx
<main className={`ios-scroll ${location.pathname === '/instructor' ? '' : 'py-4'}`} ...>
```

That's it — one line, cascades to every instructor page automatically.

## What I am NOT changing

- No edits to per-page wrappers, cards, or layouts.
- No changes to the desktop sidebar/main split (the change only affects the mobile root `<main>` which is the wrapper for instructor pages on small screens).
- No functionality, data, or styling changes other than removing the 10px horizontal padding.
- Fullscreen mode branch (line 1118) is already padding-free and stays as-is.

## Verification

After the change, open `/instructor/settings/schedule` at 390px viewport and confirm cards now reach the screen edges (limited only by each page's own `px-4`/`px-3` inner padding, which is the intended per-page padding the user described).

## Follow-up (optional, ask before doing)

A handful of pages still wrap their own content in `max-w-5xl mx-auto px-4` (e.g. `SettingsPage.tsx`, `InstructorSettingsHub.tsx`). On mobile `max-w-5xl` does not constrain, but the extra `px-4` doubles up with each page's own card padding. If, after the root fix, any page still looks too narrow, the second pass is to audit those page-level wrappers — but I'll wait for confirmation rather than touching them blindly.
