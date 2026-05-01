## Problem

On the Home screen there is a visible warm-grey block (`#F7F6F3` page background) running from the top of the screen down to the white greeting card. On a notched device this strip is roughly 100px tall (safe-area inset + 44px header row + 16px gap), so it reads as a "huge area of grey at the top".

Other screens (Pupils, Schedule, More, Track) intentionally use that warm page bg as their canvas and look correct — so the fix must be Home-only.

## Fix (visual only — no layout, data, navigation, or content changes)

### 1. `src/components/instructor/MobileBlueHeader.tsx`
- Add an optional `surface?: "page" | "white"` prop (default `"page"`).
- When `surface="white"`, set the header's `backgroundColor` to `#FFFFFF` instead of `hsl(var(--dsm-page-bg))`. The safe-area inset zone is already painted by the `html:has(.ios-instructor)` rule using the same token, so we'll override that on Home too (step 3).

### 2. `src/components/layout/InstructorPortalLayout.tsx`
- Pass `surface={isHomePage ? "white" : "page"}` to `<MobileBlueHeader />`.
- When `isHomePage`, add a class (e.g. `home-white-top`) to the outer `.instructor-portal` wrapper so we can scope the safe-area background override.

### 3. `src/index.css`
- Add a Home-only override so the body / html safe-area zone is white instead of warm-grey:
  ```css
  html:has(.instructor-portal.home-white-top),
  body:has(.instructor-portal.home-white-top) {
    background-color: #FFFFFF;
  }
  ```
- This keeps the existing rule for every other instructor screen untouched.

### 4. `src/components/instructor/HomepageHero.tsx`
- Reduce the wrapper's top padding from `pt-4` to `pt-2` (8px) so the white hero card sits flush against the now-white header with only a small breathing gap. The greeting itself keeps its internal `pt-4` so vertical rhythm inside the card is unchanged.

## Result

```text
Before                          After
┌──────────────┐                ┌──────────────┐
│ status bar   │ grey           │ status bar   │ white
├──────────────┤                ├──────────────┤
│ logo  icons  │ grey           │ logo  icons  │ white
├──────────────┤ ← 16px grey    ├──────────────┤ ← 8px white
│ ▢ Greeting ▢ │ white card     │ ▢ Greeting ▢ │ white card
└──────────────┘                └──────────────┘
```

The top of the Home screen reads as one continuous white surface flowing into the hero card. No other screen is affected.

## Out of scope

- No change to functionality, data fetching, navigation, routing or content.
- No change to other screens' header background (they keep the warm page bg).
- No change to bottom nav, FAB, or any card content.
