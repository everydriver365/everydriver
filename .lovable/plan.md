# Redesign the "Example swap" panel

The current `TestSwapVisualDemo` (src/pages/TestSwap.tsx, ~lines 541–770) crams two learner cards side-by-side with a tiny arrow between them, then forces a 4-column step strip and a phone row underneath. On the current viewport and on phones it's cluttered, the 10–11px text is unreadable, the `↳ Gets:` line is easy to miss, and the section uses fixed `padding: "0 40px 48px"` which is too tight on small screens.

## Goals

- Make the swap mechanic instantly readable: "Berty had A, Webb had B → they swap".
- Work cleanly from 320px up to desktop without horizontal scroll or squished text.
- Keep the same dark navy brand panel and existing surrounding sections untouched.

## New layout

Stack vertically on mobile, side-by-side on `md:` and up. One unified card per learner showing **Before → After** with clear date pills, and a centered swap badge between them that rotates 90° on mobile.

```text
Mobile (<768px)                Desktop (≥768px)
┌─────────────────────┐        ┌──────────┐  ⇄  ┌──────────┐
│ BF  Berty F.        │        │ BF Berty │     │ JW Webb  │
│ Before  Tue 24 Jun  │        │ Before…  │     │ Before…  │
│         09:14       │        │ After…   │     │ After…   │
│ After   Mon 16 Jun  │        └──────────┘     └──────────┘
│         10:32 ✓     │
├─────────────────────┤        ┌──────────────────────────┐
│         ⇅           │        │ How it works  1 2 3 4    │
├─────────────────────┤        └──────────────────────────┘
│ JW  J. Webb         │        ┌──────────────────────────┐
│ Before  Mon 16 Jun  │        │ ☎ DVSA 0300 200 1122 · 1 │
│ After   Tue 24 Jun ✓│        └──────────────────────────┘
└─────────────────────┘
```

### Learner card

- Avatar (40px) + name on top row, larger (15px name, 13px label).
- Two rows inside the card: `Before` (muted, strikethrough) and `After` (green check, brighter text).
- Date and time on their own line so nothing wraps awkwardly at narrow widths.
- Use `rgba(255,255,255,0.06)` background, `rgba(255,255,255,0.1)` border, 14px radius — matches the surrounding dark panel.

### Swap badge

- 44px circle with `ArrowLeftRight` icon.
- Horizontal on `md:` (between the two cards), rotated 90° (`ArrowUpDown` visual) on mobile (between the stacked cards). A subtle pulse animation hints at the swap action.

### "How it works" strip

- On mobile, switch from 4 equal columns to a 2×2 grid so each step gets ~50% width and the 10px text becomes 12px.
- On desktop, keep the single row but bump font sizes (step number 11px, label 12px) and add small connector dots between steps.

### DVSA call row

- Keep at the bottom but make the number tap-friendly: wrap in `<a href="tel:03002001122">`, increase to 16px, and add `min-height: 44px` for iOS tap target.

### Section padding

- Replace `padding: "0 40px 48px"` with responsive padding: `16px` on mobile, `40px` from `md:` up. Easiest: switch the outer `<section>` to Tailwind classes (`px-4 md:px-10 pb-12`) and keep the inner `<C>` container.

## Implementation notes

- Edit only `TestSwapVisualDemo` in `src/pages/TestSwap.tsx`. No other components, hooks, or data change.
- The component currently mixes inline styles with the project's `<C>` container. Keep that pattern but introduce a small `useIsMobile()` check (already in `src/hooks/use-mobile.tsx`) to switch between the stacked and side-by-side variants — this avoids fighting the existing inline-style approach with Tailwind responsive classes mid-component.
- Reuse the existing `learners` data array and the existing 4 step labels and DVSA copy verbatim — this is a visual restructure only, no copy changes.
- Keep the decorative blurred circle in the top-right corner.

## Out of scope

- The real `SwapBoard` / `TestRequestList` cards (already mobile-friendly).
- Surrounding hero, FAQ, and CTA sections on `/test-swap`.
- Any data, routing, or business logic.
