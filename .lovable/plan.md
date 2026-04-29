# Instructor Home — Depth Starter Set

Four targeted edits to break the flatness of `InstructorMobileHome.tsx` without restructuring layout. All scoped to the default DSM home view (no other layout styles touched). No new components, no new dependencies.

## 1. Hero greeting card (replaces lines 451–478)

Replace the plain "Hi Tom · Wednesday" text block with a single coloured anchor card:

- Background: `linear-gradient(135deg, #2B7BC8 0%, #1E5A94 55%, #163F69 100%)`
- 20px radius, soft brand-tinted shadow (`0 10px 28px -10px rgba(43,123,200,0.45)`)
- Left side: uppercase weekday label, "Hi {firstName}" headline, then a tabular-nums summary line — `{n} lessons · First {time} · £{earnings}` (each segment hidden when not applicable)
- Right side (52px): next pupil's avatar (or initials chip on white-translucent bg)
- Empty-day fallback: "No lessons today" with no avatar

This is the only coloured surface above the fold — it owns the screen.

## 2. Elevate `NextUpTile` (lines 567–595)

Wrap the existing `<NextUpTile />` in a container that adds depth without modifying the component itself:

```text
<div style={{
  margin: "0 16px",
  borderRadius: 20,
  borderLeft: "3px solid #2B7BC8",
  boxShadow: "0 8px 24px -8px rgba(43,123,200,0.18), 0 2px 6px rgba(0,0,0,0.04)",
  overflow: "hidden",
  background: "#FFFFFF",
}}>
  <NextUpTile ... />
</div>
```

Matches the colour-coded left-accent convention already used on the gap-fill card. The "Next lesson" `SectionHeader` above it stays as-is.

## 3. Tint the "quiet" cards

Wrap these five tertiary blocks so they recede into the page instead of competing with primary content:

- `InsightTilesGrid` (line 647)
- `TelematicsTile` (line 656)
- `VehicleHealthCard` (line 663)
- `IdleTimeCostCard` (line 664)
- `UpcomingEventsCard` (line 670)

Each gets a wrapper `<div>` with:
- `background: #F8FAFB`
- `border-radius: 14px`
- `border: none` (overrides any internal border via wrapper inset)
- `padding: 2px` so the existing card's own border collapses visually

Where the inner card already paints a white background, we'll add a subtle `box-shadow: inset 0 0 0 0.5px rgba(0,0,0,0.04)` on the wrapper instead so the tint shows through the surrounding margin.

The `SectionHeader`s ("Insights", "Telematics") stay outside the wrapper so the hierarchy reads top-to-bottom.

## 4. Translucent sticky next-up bar (lines 484–502)

Update the `motion.div` className from:

```text
fixed top-2 left-3 right-3 z-50 bg-primary text-primary-foreground ...
```

to use a frosted surface:

```text
fixed top-2 left-3 right-3 z-50
text-primary-foreground px-4 py-2 flex items-center justify-between
shadow-lg rounded-2xl
```

with inline `style={{ background: "rgba(43,123,200,0.78)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}`. Keeps the brand colour but lets the page texture show through — adds the "something is floating above content" feeling.

## Out of scope (deferred for the second pass)

- Replacing the activity-tile PNG icons with chip+lucide icons
- Converting `InsightTilesGrid` to a horizontal snap scroll
- Bottom tab bar blur (lives in a separate nav component)
- Streak/weekly-goal ring inside the hero card

## Files changed

- `src/components/instructor/InstructorMobileHome.tsx` (only)

## Risks

- Mobile layout policy: user explicitly requested these mobile improvements, so the mobile-update-policy memory is satisfied for this pass.
- `backdrop-filter` is unsupported on older Android WebView; falls back gracefully to the solid blue tint.
- `todayOverview.totalEarnings` field name will be verified against the hook's return type before the edit; if absent, that segment is dropped silently.
