## Instructor Mobile UI Polish Pass

Four coordinated improvements scoped to the instructor portal only (`.instructor-portal` / `.dsm-instructor`). Mobile layouts are unchanged structurally — only visual styling, skeletons, and section headers.

### 1. Unified tile elevation

Pick a single shadow system for all white tiles sitting on the new `#ECEEF1` background.

- Standardise on `shadow-premium` (already defined in `index.css`).
- Update `InstructorTile.tsx` to drop its custom inline `boxShadow` and use the shared class.
- Update `InstructorCard.tsx` to use the same shadow tokens (already does — verify).
- Result: every white tile (Quick actions, rings card, Next up, etc.) has identical elevation.

### 2. Soften / strengthen hairline borders

With the darker bg, `0.5px solid #EEF0F4` is invisible. Two paths chosen per component:

- **Tiles with shadow** (`InstructorTile`, `InstructorCard`, `WeekAtAGlanceCard`): remove the border entirely — let the unified shadow define the edge.
- **Borderless surfaces inside tiles** (segmented controls, legend rows): keep `#E5E7EB` for clarity.

### 3. Empty-state polish

Upgrade the existing `EmptyState.tsx` component with:

- A small monochrome line illustration slot (SVG, 64px, `#C7C7CC`).
- Uppercase tracked title, body copy, and an optional CTA button styled like iOS.
- Apply across "No lessons today", "No pupils yet", and "No outstanding tasks".

No new illustrations created from scratch — use existing Lucide icons sized 64px with reduced opacity as the placeholder graphic.

### 4. Consistent uppercase section headers

Adopt the rings-card eyebrow style (`11px / 500 / #6E6E73 / 0.3px tracking / uppercase`) as the standard section header on the home screen.

- Refactor `SectionHeader.tsx` to this exact style.
- Apply above each home section: "UP NEXT", "QUICK ACTIONS", "TODAY", "QUICK SEARCHES".
- Adds a strong iOS Settings-app rhythm to the home view.

### Files touched

- `src/components/instructor/InstructorTile.tsx` — drop custom shadow + border, use `shadow-premium`.
- `src/components/instructor/InstructorCard.tsx` — verify shadow token, drop any redundant border.
- `src/components/instructor/WeekAtAGlanceCard.tsx` — remove the `0.5px hairline` border on collapsed + expanded card.
- `src/components/instructor/EmptyState.tsx` — add icon prop, restyle.
- `src/components/instructor/SectionHeader.tsx` — restyle to uppercase eyebrow.
- `src/components/instructor/InstructorMobileHome.tsx` — wrap each section in `SectionHeader` for consistency (no layout/structural changes).

### Out of scope (intentionally)

- Any change to tile order, grid columns, or spacing rhythm beyond what `SectionHeader` provides.
- Pull-to-refresh, sticky compact header, reorder mode, colour palette reduction — deferred to future passes.
- Dark mode: tokens already scoped via `.dsm-dark`; visual changes here will inherit correctly.
