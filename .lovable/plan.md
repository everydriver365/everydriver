## Goal
Reduce home-page noise by collapsing the full **Categories** browser into a single "Browse all tools" row that expands on tap. Frequently used + search remain unchanged.

## Why
Today the home page shows three overlapping discovery surfaces: Quick Actions (top), Frequently used (6 personal pins), and the full Categories list (8 expandable folders covering ~33 tools). The search bar already provides instant access to anything, so the always-expanded category list is mostly empty vertical space scrolled past on every visit.

## Change

In `src/components/instructor/HomeToolsHub.tsx`, replace the current Categories block (lines ~552–642) with a single collapsed row inside the same white rounded container:

```text
┌────────────────────────────────────────┐
│ 🔲  Browse all tools           33  ›   │
└────────────────────────────────────────┘
```

- Tap → expands to reveal the existing 8 `CategoryRow`s (and their nested tool grids work exactly as today).
- Chevron rotates 90°, same `AnimatePresence` motion already used.
- Section label "Categories" is removed; the row is self-describing.
- Total tool count (sum of `validTiles` across all categories) shown on the right.
- Default state: **collapsed**. State is local (no persistence needed); resets on navigation, matching the ephemeral nature of browse.

No changes to:
- `QuickAccessTiles`, `tileRegistry`, search bar, Frequently used grid
- The CategoryRow / PrimaryToolCard / LargeToolCard internals — they're reused inside the expanded panel
- Routes, pinned-tile data, plan-feature gating

## Result
- Home above-the-fold: header → search → Quick Actions → Frequently used → single "Browse all tools" row. Roughly 60% less vertical content.
- Power users can still drill into Categories with one extra tap.
- Search remains the primary fast path for anyone who knows what they want.
