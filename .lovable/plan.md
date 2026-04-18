
Remove the Today's Route preview from the instructor dashboard.

## Changes

1. **`src/pages/instructor/Index.tsx`** (or wherever `TodayRoutePreview` is rendered on `/instructor`) — remove the `<TodayRoutePreview />` usage and its import.
2. **Delete `src/components/instructor/TodayRoutePreview.tsx`** — no longer used.
3. **Delete `src/hooks/useTodayRoute.ts`** — only consumed by the component above.

I'll grep first to confirm there are no other consumers before deleting, and fall back to just removing the render if anything else references them.

No backend, schema, or styling changes. Today's Schedule list and the Next Up ETA tile remain untouched.
