# Premium Redesign — Expanded Next Lesson Tile

Scope: **only** the hero card that renders inside the expanded section of `src/components/instructor/NextUpTile.tsx` (lines ~717–1057). Everything below it (map preview, travel bar, route, lesson details, conditions, status, wizard) and the collapsed header stay exactly as they are. All handlers, state machine (`getNextUpVisibility`), Supabase calls, status logic, nudge SMS, Start/End lesson flow, and the four-item status strip behaviour remain untouched.

## What changes visually

### 1. "Up next · tap to hide" header strip (lines 552–573)
- Keep label + chevron, keep the tap-to-collapse button.
- Add a subtle 0.5px divider directly below it (currently the divider lives on the inner content `borderTop`).
- Refine: 12.5px, weight 700, letter-spacing 1.1, colour `#5B5CE2` (kept).

### 2. Outer expanded wrapper (line 717)
- Replace the bare `borderTop` content container with a soft off-white inset:
  - background `#F7F7FB` (cool off-white)
  - inset padding 14px on all sides
  - radius 22px (so the inner white card visibly floats inside it)
  - removes the current hard `borderTop: 0.5px solid #c6c6c8`

### 3. Inner hero card (lines 720–1057 wrapper `<div>`)
- White surface, `borderRadius: 24`, `border: 0.5px solid rgba(15,23,42,0.06)`, shadow `0 1px 2px rgba(16,24,40,0.04), 0 14px 34px -12px rgba(16,24,40,0.10)`.
- Internal padding 18px; replace the existing 12/16px paddings inside subsections with a single padded container plus 14px gaps between blocks.

### 4. Top row — UP NEXT label + name (left) and pill + time (right)
- Left column:
  - Tiny pill-style "UP NEXT" eyebrow (Calendar icon 11px + 11px label, weight 700, `#5B5CE2`, letter-spacing 0.6, uppercase) above the pupil name.
  - Pupil name: 26px, weight 700, `-0.5` tracking, `#0B0B0F`.
- Right column (right-aligned, stacked):
  - Confirmation pill (kept logic, restyled — see §5) sits on top.
  - Time: 30px, weight 700, tabular-nums, `#0B0B0F`, `-0.7` tracking.
  - Date label `getDateLabel()` ("Today" etc.) below at 14px, `#6E6E73`.
- Replace the current separate "STATUS ROW" (727–813) and "NAME + TIME ROW" (816–834) with this combined two-column row. The pill JSX (the entire IIFE at 731–809) is reused inline — only the wrapping container changes.

### 5. Confirmation pill restyle (within IIFE 731–809)
- Awaiting (and pending fallback): rounded-full pill, bg `#FFF4D6`, text `#8A5A00`, 12px label, 11px clock icon on the left (`Clock` from lucide), tap-to-nudge handler unchanged. Pulsing dot retained but moved to a 6px `lucide` `Clock` glyph for a cleaner look (still amber `#D4A017`, halo animation reused).
- Confirmed: bg `#E5F6EC`, text `#137333`, `Check` icon.
- Declined / Cancelled: bg `#FCE6E6`, text `#B42318`, `XCircle` icon.
- Reminder-sent transient state keeps green text on transparent.

### 6. Lesson meta block (lines 837–861)
- Wrap in a subtle container with a 2px blue-violet accent bar on the far left (`#5B5CE2`, opacity 0.55, `borderRadius: 2`).
- Three rows, each prefixed with a 24px circular tinted icon badge:
  - Car (lesson type + duration): badge `rgba(91,92,226,0.10)`, icon `#5B5CE2`.
  - MapPin (address): same tint.
  - Clock (countdown): badge `rgba(0,122,255,0.10)`, icon `#007AFF`, text `#007AFF` for emphasis.
- Row text: 15px, primary row `#0B0B0F`, secondary rows `#48484A`. Vertical gap 10px. Use the existing `formattedPickupAddress`, `formatHoursLong`, `getCountdownText` calls verbatim.

### 7. Primary action row (lines 920–960)
- Replace the equal-flex transparent-with-hairline row with a 3-column grid (`1.2fr 1fr 1fr`, gap 10) of filled pill buttons:
  - **Nav**: bg `#0A6CFF`, white icon + label, shadow `0 8px 18px -6px rgba(10,108,255,0.45)`, height 52, radius 18.
  - **Call**: bg `rgba(52,199,89,0.12)`, icon + label `#1F8B3A`, height 52, radius 18, no shadow.
  - **Text**: bg `rgba(0,122,255,0.10)`, icon + label `#0A6CFF`, height 52, radius 18, no shadow.
- Icons 18px, label 15px weight 600 next to the icon (single-row layout).
- The Start lesson and End lesson branches in the IIFE keep their current full-width transparent treatment but the button becomes filled to match the new design language:
  - Start: bg `#0A6CFF`, white text, height 52, radius 18, `Play` icon kept.
  - End: bg `rgba(255,59,48,0.10)`, text `#D70015`, height 52, radius 18, `CheckCircle2` kept.

### 8. Four-item status strip (lines 999–1056)
- Wrap in a single rounded segmented card: bg `#F1F2F6`, border `0.5px solid rgba(15,23,42,0.06)`, radius 18, padding 4, height auto.
- Each segment becomes an inner cell (radius 14, min-height 56), separated by 0.5px `#D8DAE0` vertical hairlines (kept).
- Active segment: white background, soft shadow `0 4px 12px -4px rgba(16,24,40,0.10)`, icon + label in `#0A6CFF`.
- Inactive: transparent, icon + label `#6E6E73`.
- Icon stays above label; label 12px weight 600.

### 9. Hairline cleanup
- Remove the two solid full-bleed hairlines at lines 864 and 964 (no longer needed once the action row is a filled button group sitting between meta and status strip with natural padding).
- Inline status banner (`statusBanner`, lines 967–996) keeps its appearance but becomes a tinted soft chip (bg `rgba(0,122,255,0.08)` for en_route, `rgba(255,149,0,0.10)` for late) sitting between the action row and the status strip with 12px radius and 10px vertical spacing.

## What does NOT change

- All hooks, queries (`useNextLessonDetails`, `useQuery` for last lesson), and props.
- `getNextUpVisibility` branching (Start lesson / End lesson / 3-button row).
- Nudge SMS handler, `setNudgeSentAt`, `toast` calls.
- All click handlers: `handleNavigate`, `handleCall`, `handleMessage`, `handleSendETA`, `handleArrived`, `setLateSheetOpen`, navigate to pupil progress.
- Map preview, travel bar, route block, lesson details/conditions/pupil context cards, reschedule/cancel section, wizard sheet.
- Collapsed header (avatar + identity + right-side time + small Call/Nav circles).
- The auto-clear "Reminder sent" effect.
- A11y attributes (`aria-label`, `aria-pressed`, `aria-expanded`).

## Files touched

- `src/components/instructor/NextUpTile.tsx` — only inside the `expanded && (...)` branch (lines 707–1057). No new files, no new dependencies (icons already imported from `lucide-react`).

## Risk

Very low — pure styling and JSX restructuring within one branch. State-machine, data flow, and downstream sections are not touched. No type-level changes.
