## Goal

Restyle the live "Up next" tile (`NextLessonPreviewCard`) to match the **V39 · Live · Map Strip** look from `InstructorNextUpLab`, while preserving every current function:

- Real `GoogleMap` with route polyline + origin/dest markers
- Live ETA from `useTrafficETA` (incl. running-late detection)
- Countdown / "starts in" text and dot
- Three action buttons: **Call**, **Text**, **Go** (not just Call/Navigate)
- AI-divert pill (when `aiDivertTime` and ≤24h)
- Avatar opens pupil profile (`openProfile`)
- Inline `AnimatePresence` extras panel (Pupil/Stats/Payment/Notes) under the buttons
- `Details ▾ / Hide details ▴` handle and all keyboard/aria affordances
- All existing props, hooks, handlers untouched

## What changes (visual only)

Reorder and restyle the **collapsed** card so the map sits on top, matching V39:

```text
┌── Up next card ──────────────────────────────┐
│  ┌─ Map strip 110px (GoogleMap, real route) ┐│
│  │  [● Live · in 12m]      [↗ ETA 18m · pill]││
│  │  ...polyline + markers...                 ││
│  └───────────────────────────────────────────┘│
│  Time hero · Pupil name · Lesson · Postcode   │  ← left
│                                  [ avatar 44 ] │  ← right
│  [⚠ Running late by 6m — Send ETA]  (existing)│
│  [✨ AI divert at 18:00]              (existing)│
│  [ Call ]  [ Text ]  [ Go ]                   │  ← 3 buttons (kept)
│  ─────────── (only when expanded) ────────────│
│  Pupil row · Stats · Payment · Notes          │  ← unchanged
│  ─────────────────────────────────────────────│
│  Details ▾  /  Hide details ▴                 │
└───────────────────────────────────────────────┘
```

### Header band (was #F0F5FF tint with 38px time)
Removed. The map becomes the new header.

### Map strip (was 60px below header)
Promoted to top of card, height **110px** (V39 spec). Same `GoogleMap` component, same options, same polyline/markers — only the height and the two overlay chips change:

- **Top-left chip** — replaces the small ETA pill. White 92%-opacity pill, 4×9 padding, radius 999, `#3D55A1` text. Uppercase 10px label "LIVE · IN {countdown}" with a 5px dot ring (red `#CC2229` if ≤15m, otherwise blue `#3D55A1`). Driven by existing `minutesUntil` / `countdownText`.
- **Top-right chip** — replaces the bottom-right "Navigate →" button. Same white pill, 11px tabular-nums, shows `↗ {driveMin}m · {miles}mi` when ETA known; falls back to `Tap for ETA` (still triggers `onGo`). Distance reuses existing `distanceMi` if present, otherwise omits the `· Xmi` segment.

### Info area (replaces old header band content)
New 16px-padded row, white background:

- **Left column**: 28px bold tabular-nums time (`startLabel`) → 13px bold pupil name → 11px muted `Lesson type · Postcode` (kept lesson-type pill content as plain text). Running-late banner, when active, sits under this row using the existing `useRunningLateDetection` output (kept intact, just restyled to a slim red pill).
- **Right column**: existing 44×44 avatar button (`openProfile`) — moved from the old header band.

### Details rows (Clock / MapPin row pair)
Removed as separate icon-rows — their info is now in the compact left column ("Lesson type · Postcode"). Pickup-only fallback ("Location TBC") still renders inline.

### Action buttons
Kept **all three** (Call / Text / Go) with current handlers and disabled states. Only the visual styling adopts V39's `btnPrimary` / `btnSecondary` look (radius 12, height 38, primary = `#3D55A1`, secondary = `#EDF2FE`). Mapping:
- Call → primary red kept (it's the most-used CTA today)
- Text → secondary
- Go → secondary

(Or all three using V39 secondary + Go primary — see open question below.)

### AI divert pill, expanded extras, Details handle
**Untouched** — same JSX, same animations, same handlers, same hooks.

## What stays the same (no change)

- `useNextLessonDetails`, `useTrafficETA`, `useRunningLateDetection`, `usePupilLessonHistory`, `usePupilPaymentStatus`
- All props (`onCall`, `onText`, `onGo`, `openProfile`, `pupilId`, etc.)
- `GoogleMap` config, route fetching, polyline icons, origin/dest overlay markers
- `AnimatePresence` extras block and its contents (Pupil row, Stat grid, Payment pill, Notes)
- Bottom Details/Hide handle and chevron
- `expanded` state machine and aria attributes
- `InstructorMobileHome` and `SettingsV2HomeView` wiring

## Files

- `src/components/instructor/NextLessonPreviewCard.tsx` — restructure the collapsed return only (lines ~376–642). Move map strip to top, swap chips, replace header band with the new info row, restyle buttons. Expanded section (lines ~644 onwards) untouched.

## Open question (one decision needed)

Action-button styling: keep **Call as primary red** (preserves today's emphasis on calling the pupil) or follow V39 exactly and make **Go the primary** action with Call/Text secondary? I'll default to keeping Call red unless you say otherwise.

## Out of scope

- No data, hook, route or handler changes
- No edits to `NextUpTile.tsx`, `UpNextCard`, mobile home wiring, or any home-view component
- No new lab variants
