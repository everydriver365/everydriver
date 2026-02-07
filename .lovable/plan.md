

## Fix Messages Icon Transparency and Outline

### Problem
The `MessagesIcon` SVG has two issues:
1. The chat bubble tail path (`M38 70 C38 70 30 82 28 86 C28 86 40 78 44 75`) is **not a closed path** — it's missing the `Z` close command, so it renders as a thin stroke/outline rather than a solid filled shape.
2. The `fillOpacity="0.95"` on both the ellipse and path makes the white slightly transparent, letting the green background bleed through.

### Fix (single file change)

**File: `src/components/icons/MessagesIcon.tsx`**

- Close the bubble tail path by adding `Z` at the end so it fills as a solid shape
- Change `fillOpacity` from `0.95` to `1` on both the ellipse and the path so the white is fully opaque
- This will make the icon look like the solid iOS Messages icon with a proper filled chat bubble

