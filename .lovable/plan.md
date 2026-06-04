## Problem

On `/booking/chapmans` mobile, tapping the **Grid** toggle highlights the button but the layout never changes — cards stay in a single-column list. The `viewMode` prop is passed into `ChapmansMobileResults` and used only to style the toggle buttons; the cards wrapper (`<div style={{ padding: "0 16px" }}>`) renders the same regardless.

## Fix (mobile only, Chapmans only)

In `src/components/courses/ChapmansMobileResults.tsx`:

1. When `viewMode === "grid"`, render the cards wrapper as a 2-column CSS grid:
   - `display: grid; gridTemplateColumns: "1fr 1fr"; gap: 8px; padding: 0 16px`
2. When `viewMode === "list"`, keep current single-column list (unchanged).
3. Compact each card for the grid variant so it works at ~half-width:
   - Stack price under title (no side-by-side row)
   - Hide secondary meta line (location / distance) — keep date only
   - Shrink instructor row (avatar 20px, name truncated)
   - Remove `marginBottom: 8` on cards (grid `gap` handles spacing)
4. Keep all pricing, offer, navigation, and Pass Promise logic untouched.
5. Desktop and non-Chapmans flows untouched.

No other files change. No data/pricing logic changes.