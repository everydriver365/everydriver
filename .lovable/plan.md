
The user added the `shadow-lift` tokens and applied them to several card components, but the shadows still aren't visible. Let me investigate why.

Likely causes:
1. The instructor home page uses tile components that weren't updated (e.g. inline-styled tiles like `WaitingRoomPromoTile`, or other tile components on `/instructor`).
2. The background `#E4EEFB` is light blue, but the shadow uses `rgba(20, 30, 60, 0.14)` — should be visible. So it's more likely the components on screen don't use the updated shared components.
3. Components may have inline `boxShadow` styles that override the Tailwind class (inline styles win over CSS classes).

Let me check the actual instructor home page and what tiles render there.
