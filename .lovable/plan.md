

## Plan: Enlarge Hero & Embed "This Week" Tile Inside It

### Current State
- `HomepageHero.tsx` has a 100px hero banner with a gradient overlay and greeting text
- The "This Week" card sits **below** the hero, overlapping with `-mt-4`

### Changes (single file: `src/components/instructor/HomepageHero.tsx`)

1. **Increase hero height** from `h-[100px]` to `h-[200px]` to accommodate both the greeting and the "This Week" tile
2. **Move the "This Week" card inside** the hero banner area (remove the overlapping `-mt-4` layout)
3. **Restyle the "This Week" card** for the dark hero context — use `bg-white/15 backdrop-blur` with white text so it sits naturally within the hero image
4. **Adjust greeting position** to sit at the top of the hero, with the "This Week" tile at the bottom
5. **Update progress ring colors** to white tones to match the hero overlay context

### Layout (top to bottom within the hero):
```text
┌──────────────────────────────┐
│  Hero image + gradient       │
│                              │
│  "Good Morning, John"        │
│  "Wednesday 4 March"         │
│                              │
│  ┌────────────────────────┐  │
│  │ THIS WEEK              │  │
│  │ Keep it moving!    3/5 │  │
│  │ 4 lessons scheduled    │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

No other files need changing — the component is self-contained.

