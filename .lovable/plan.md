## Scope

Design-only pass on the two carousel-style tile groups on `/instructor` (rendered by `src/components/instructor/InstructorMobileHome.tsx`):

1. The swipeable **Quick actions** carousel (orphan top group — `SwipeableQuickAccess`) → relabel section as **"More tools"**.
2. The **Insights** grid (`InsightTilesGrid` — Fill gaps, Vehicle health, Smart nudges, Re-engage).

No functional changes. No tile added or removed. Carousel pagination, swipe, search, mic FAB, every route, every data source, every analytics event left exactly as today.

## Findings (pre-flight)

- The "orphan top group" is the Quick actions carousel powered by `SwipeableQuickAccess`. Page 1 is currently Course planner, Agenda, Accessibility, Pupils. The section already has a `SectionHeader title="Quick actions"` plus a search affordance — the heading just doesn't match the uppercase 11px eyebrow spec.
- The Insights group uses the same `SectionHeader` component (which renders the "| Insights" vertical-bar marker the prompt wants gone).
- Carousel tiles already use the white-card "refined" variant of `Tile` (hairline `#E5E5EA`, `font-weight: 500`, 16px-equivalent title) — visually compliant with the contrast pass. The wrapper `TileGrid` paints a grey `#EAEAEA` backdrop behind the tiles; harmless but not part of the spec.
- Insights tiles use `InstructorTile` (already hairline white card, tinted icon roundel). Counts render today as a saturated solid-fill **circle on the icon corner** (background = full `accent` colour, white digit). The spec wants a calm tinted **pill in the top-right of the row** with `bg = tint`, `colour = accent`.
- Vehicle health subtitle today is `"{N} fault(s) detected"` (or `"All clear"`). Source: `useVehicleHealth().devices[].last_fault_codes` — only OBD codes, no friendly fault name. Will keep `"{N} fault detected"` fallback wording unless a friendly description is available.
- Optional renames "Smart Nudges → Smart tips" and "Re-engage → Needs attention" — display-label only, data hooks untouched. Including them since they are pure visual and the prompt allows.

## Files to change

### 1. `src/components/instructor/EyebrowLabel.tsx` (already exists, reuse as-is)

Already matches the spec (11/500/#6E6E73/uppercase/0.3px/margin 0 0 10px). No change.

### 2. `src/components/instructor/InstructorMobileHome.tsx`

- Replace the `SectionHeader title="Quick actions"` block above `SwipeableQuickAccess` with an `EyebrowLabel` reading **"More tools"**, keeping the existing search button on the right inside the same flex row (preserving search behaviour). No "View all" link.
- Replace the `SectionHeader title="Insights"` block with an `EyebrowLabel` reading **"Insights"**.
- No other markup changes; carousel, mic FAB, telematics, etc. untouched.

### 3. `src/components/instructor/InsightTilesGrid.tsx`

- Pass new props through to a slightly extended `InstructorTile` so the badge renders as a calm tinted pill in the top-right of the icon row instead of a saturated dot on the icon.
- Update display strings:
  - Fill gaps subtitle: `"{N} open slots this week"` (was `"{N} open slots"`).
  - Smart nudges title: **"Smart tips"**, subtitle: `"{N} suggestions ready"` (was `"{N} tips ready"`).
  - Re-engage title: **"Needs attention"**, subtitle unchanged (`"{N} dormant pupils"`).
  - Vehicle health subtitle: keep `"{N} fault detected"` / `"{N} faults detected"` / `"All clear"` (no friendly name source available).
- Hooks `useVehicleHealth`, `useDormantPupilsCount`, `useSmartNudgesCount`, `gapSuggestions` and all routes left untouched.

### 4. `src/components/instructor/InstructorTile.tsx`

Add an optional `badgeVariant?: "green" | "blue" | "amber" | "red" | "purple" | "grey"` prop. When `count` is set and `badgeVariant` is provided, render the count as a pill in the top-right of the icon row instead of the existing saturated corner dot. Existing behaviour (no `badgeVariant` → current dot) preserved so other call sites (`ActivityTilesGrid`) are unaffected.

Pill spec exactly per prompt:

```
border-radius: 999px
padding: 3px 9px
font-size: 11px / weight 500
background = tint, colour = accent (per category)
```

### 5. `src/components/instructor/SwipeableQuickAccess.tsx`

No code change required. Carousel, pagination dots, search, lock-on-feature, every route preserved. Tiles already render in the compliant "refined" variant.

Optionally remove the `background: "#EAEAEA"` from `TileGrid`'s outer padding block when `variant === "refined"` so the carousel sits on the page background — this is cosmetic and listed only as a possible polish; will only do it if it doesn't affect other surfaces (verified `TileGrid variant="refined"` is only used inside `SwipeableQuickAccess`).

## What stays exactly as today

- `SwipeableQuickAccess` ordering of all 33 tiles, `TILES_PER_PAGE = 4`, pagination dots, embla carousel, search, locked-tile toast and upgrade routing, mic FAB, every `route` value.
- `InsightTilesGrid` route map, demo-mode logic, `useVehicleHealth` / `useDormantPupilsCount` / `useSmartNudgesCount` queries and caching, `liveDot` behaviour.
- All `SectionHeader` instances elsewhere on the home (Today's schedule, Telematics, etc.) — only the two specified eyebrows change.
- Accessibility tile remains in the Quick actions carousel exactly where it is today.

## Confirm before proceeding

Two small judgement calls — happy to flip either:

1. **Optional renames** (Smart Nudges → Smart tips, Re-engage → Needs attention). Plan above includes them. Reply "skip renames" to keep current labels.
2. **Vehicle health subtitle** — falling back to `"{N} fault detected"` because no friendly fault-description string exists in the current data source. If that's not acceptable I can wire an OBD-code → human-name lookup using the existing `src/lib/obdCodeLookup.ts` (small additional change, still no data source replaced).

Approve and I'll implement.