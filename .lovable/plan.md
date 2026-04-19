
Goal: make the icon choices visible inside the app itself, since the previous chat-based preview did not render for you.

Plan

1. Add a temporary in-app icon preview screen/sheet for the instructor mobile app
- Show 3 clear icon style sets in the actual DSM UI style.
- Each set will include:
  - Bottom tab bar preview: Home, Schedule, Track, Pupils, More
  - Mini card preview: Job offers, Messages, Tests, Fill gaps
  - Telematics preview icon
- This avoids relying on chat rendering.

2. Use real app components so the preview matches the finished result
- Reuse the existing icon container styling from:
  - `ActivityTilesGrid.tsx`
  - `InstructorBottomNav.tsx`
  - `TelematicsTile.tsx`
  - `InsightTilesGrid.tsx`
- Only swap icon choices per set, not colours/layout.

3. Present 3 cohesive icon directions
- Set A — SF Filled: closest to the current filled Apple-style look
- Set B — Rounded Friendly: softer, more approachable shapes
- Set C — Minimal Clean: simpler, lighter visual language
- I’ll label each set clearly so you can choose by tapping or replying with A/B/C.

4. After you choose, apply that set app-wide on instructor mobile only
- Update the icon imports and mappings in the existing components.
- Keep all colours, spacing, routes, counts, badges, and logic unchanged.

Files likely involved
- `src/components/instructor/InstructorBottomNav.tsx`
- `src/components/instructor/ActivityTilesGrid.tsx`
- `src/components/instructor/TelematicsTile.tsx`
- `src/components/instructor/InsightTilesGrid.tsx`
- one temporary preview component/page to display the options visibly

Technical notes
- No backend/data changes.
- No structural redesign.
- This is purely a visual icon-selection flow, then a final icon swap once chosen.

Verification
- Open the preview on mobile width
- Confirm all 3 icon sets are visible
- Confirm each set shows tab bar + mini cards + telematics icon
- After selection, verify the chosen icons appear consistently across the instructor mobile app
