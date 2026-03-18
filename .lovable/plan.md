

## Plan: Add "Platform Updates" tile to SwipeableQuickAccess

The instructor mobile dashboard uses `SwipeableQuickAccess.tsx` for its quick action tiles — a separate tile list from the popover menu and home grid. "Platform Updates" needs to be added to the `ALL_TILES` array in that file.

### Changes

**`src/components/instructor/SwipeableQuickAccess.tsx`**
- Import `Megaphone` from `lucide-react`
- Add a new tile entry to the `ALL_TILES` array:
  ```
  { title: "Platform Updates", subtitle: "News & ideas", icon: Megaphone, accent: "#6366F1", route: "/instructor/platform-updates" }
  ```

That's the only change needed — the tile will automatically appear in the swipeable grid pages.

