

## Plan: Remove the shadow behind the Quick Actions tiles

The "shadow" the user sees in the screenshot is the drop shadow rendered by `WarmTile` on each Quick Actions tile. I'll remove (or flatten) that shadow so the tiles sit cleanly on the page background.

### Change

In `src/components/instructor/WarmTile.tsx`:

- Remove the `boxShadow` from the tile's default style so the tiles render flat against the `/instructor` background.
- Keep the existing border/stroke and rounded corners so the tiles still read as distinct cards — just without the lifted shadow.
- Keep the `primary` variant's accent ring (the red outline on "Track lesson") intact — only the soft drop shadow is removed.

### Files to edit

- `src/components/instructor/WarmTile.tsx` — set `boxShadow: "none"` (or remove the shadow declaration) on the tile container.

### QA at 390px on `/instructor`

- Quick Actions tiles ("Course planner", "Agenda", "Pupils", "Track lesson") sit flat with no visible drop shadow underneath.
- "Track lesson" still shows its red primary outline.
- Other tile-using surfaces that import `WarmTile` are checked — if any rely on the shadow for separation, confirm they still read correctly; otherwise flat is preferred for consistency with the rest of the instructor portal.

