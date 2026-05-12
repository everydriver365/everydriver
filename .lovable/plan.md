## Goal

Redesign the visual presentation of the "Up Next" lesson tile on the instructor mobile home (`src/components/UpNextCard/UpNextCard.tsx`) to match the supplied spec. Logic, data, handlers, expand/collapse, AI divert, map component and navigation remain untouched.

## Scope

- **Only file edited**: `src/components/UpNextCard/UpNextCard.tsx`.
- No changes to `NextLessonPreviewCard` (used when the next lesson is >4h away), `StaticMapPreview`, `FullscreenMapModal`, `NextUpTile`, hooks, or `InstructorMobileHome` wiring.

## Visual changes

1. **Container** — keep current rounded card; tighten shadow/border tokens to match spec (`borderRadius 20`, shadow `rgba(26,82,160,0.11)` 16-blur, `border 0.5px rgba(26,82,160,0.09)`).
2. **Section label** — keep existing "Up next" label (already matches).
3. **Header band** — rebuild as **time-hero**:
   - Background `#F0F5FF`, padding `14px 13px 12px`.
   - Top row: large `38px / -2 letter-spacing / #1A52A0` start time on the left with red-dot + `countdown · dayLabel` line beneath; **avatar (40×40) on the right**, `justifyContent: space-between`.
   - Pupil name (`15px / 700 / #1A1A1A`) **below** the time block, not beside it.
   - Avatar keeps profile-image fallback to initials, keeps tap-to-open-profile handler.
4. **Map strip** — reduce height from 72px → **60px**; keep `StaticMapPreview` (hasDestination, height=60), keep open-fullscreen tap. Restyle ETA pill (`top:7,left:8`, green dot, `ETA {n}m via {route}` — route only when available from `useTrafficETA`, otherwise just `ETA {n}m`; "Tap for ETA" fallback unchanged). Restyle Navigate pill (`bottom:5,right:8`, `rgba(26,82,160,0.88)`).
5. **Details section** — padding `9px 12px 8px`. Lesson-type row shows `Standard lesson · {duration} · £{fee}` only **if a fee value is available**; otherwise fall back to current `Standard lesson · {duration}` (no new data fetching). Pickup row gains a small "Pick-up" sub-label (already present, restyled). AI divert pill styling per spec, render only when `aiDivertTime` truthy (unchanged behaviour).
6. **Action buttons** — same three buttons (Call / Text / Go), restyled to spec sizes (`flex 1.3 / 1 / 1`, height ~32, `gap 5`, Call red `#CC2229` with shadow, Text/Go `#EEF3FF` on `#1A52A0`). Handlers untouched.
7. **Expand handle** — restyle to slimmer `6px` vertical, `#FAFBFD` bg, `9px / #8E8E93` label, smaller chevron. State + `NextUpTile` expansion preserved.

## Hard constraints (locked)

- Do not touch `handleCall`, `handleText`, `handleNavigate`, `openProfile`, `openMap`, `setExpanded`, `useTrafficETA`, `StaticMapPreview`, `FullscreenMapModal`, `NextUpTile`, or `AnimatePresence` block.
- Do not modify props interface or any caller (`InstructorMobileHome`, `SettingsV2HomeView`).
- ETA pill and Navigate button and Go button all call the same existing `handleNavigate`.
- `pupilAvatarColor` fallback to `#CC2229` already in place — keep.
- No new packages, no new icons beyond those already imported.

## Out of scope

- The ">4h away" `NextLessonPreviewCard` variant is not redesigned (different component, different state).
- Desktop instructor home, Settings V2 home view, school/admin views.
- Adding a fee field if not already in props (will only render `· £{fee}` when present; otherwise omit).

## Files

- `src/components/UpNextCard/UpNextCard.tsx` — restyle JSX from line ~117 onward (header band, map strip, details, expand handle). No prop or handler changes.
