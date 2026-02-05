

## Make Instructor Mobile Home Hero Full Width

This plan will modify the `ContextualHomeHero` component to make the overlapping card extend to the full width of the screen, removing the side margins.

---

### What Will Change

The overlapping contextual card (the glass card that shows the greeting, weather, and stats) currently has horizontal margins (`mx-3` = 12px on each side). We'll remove these margins so the card stretches edge-to-edge while keeping the internal padding for content readability.

---

### Technical Changes

**File: `src/components/instructor/ContextualHomeHero.tsx`**

| Location | Current | Updated |
|----------|---------|---------|
| Line 347 | `<div className="relative -mt-16 mx-3">` | `<div className="relative -mt-16">` |

This single change removes the `mx-3` class from the overlapping card wrapper, making the hero card span the full viewport width.

---

### Visual Result

```text
Before:                          After:
┌──────────────────────┐        ┌──────────────────────┐
│     Hero Image       │        │     Hero Image       │
├──────────────────────┤        ├──────────────────────┤
│ ┌──────────────────┐ │        │ ┌──────────────────┐ │
│ │  Card (mx-3)     │ │   →    │  Card (full width)  │
│ └──────────────────┘ │        │ └──────────────────┘ │
│  ← 12px →     ← 12px→│        │← 0px →        ← 0px→ │
└──────────────────────┘        └──────────────────────┘
```

The internal content padding (`p-4`) remains unchanged, ensuring text and icons don't touch the screen edges.

