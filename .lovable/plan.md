# Tracking screen redesign + functional improvements

Restyle `/instructor/tracking` (and `/every-instructor/tracking`) to the premium tile system used by Home / Schedule / Pupils / Settings. Behaviour, routing, and data bindings stay identical — only the visuals change, plus three small functional improvements baked in.

## Files

### Modified
- **`src/pages/InstructorLiveSession.tsx`** — page shell: replace the navy-pill toggle with `<SegmentedControl>`, rebuild the dashcam card and the active-session "Resume" banner, drop legacy box-shadows on the page wrapper, restore #FFFFFF background.
- **`src/components/instructor/tracking/GPSStatusHero.tsx`** — refactor to the new `<ConnectionStatusCard>` spec inline (state-aware tinted icon + dot, uppercase device eyebrow, bullet separator, vehicle/driver name).
- **`src/components/instructor/tracking/SessionStartPanel.tsx`** — full rebuild around the new spec (eyebrow "Test route", 17px title, two-state pupil row, primary button blue at rest / navy when recording, secondary outline button, dynamic helper text). All callbacks unchanged.

### Created
- **`src/components/instructor/ui/PupilSelectorRow.tsx`** — two-state row (no pupil → tinted icon block; selected → deterministic avatar matching the Pupils-list hash). Tap opens picker.
- **`src/components/instructor/ui/ConnectionStatusCard.tsx`** — generic state-aware status card (40×40 tinted icon, 10px overlay status dot, 15px title, eyebrow + bullet + detail row).
- **`src/lib/pupilAvatarColor.ts`** — extracted avatar-colour hash (same palette + seed logic already in `PupilCardStack.tsx`) so Tracking uses the exact same colour for the same pupil. Pupils list is also refactored to import from here (single source of truth — no behaviour change).

### Reused
- `<SegmentedControl>` for Live / Fleet.
- `<SectionLabel>` for any eyebrow labels.
- The `LessonRouteRecorder`, `SatNavLiveMap`, `RecentSessionsList`, `DeviceSelectorDropdown`, `FloatingSessionTimer`, `DrivingTestStartDialog`, `TripSummarySheet`, fullscreen-mode branch, and "no device configured" empty state are left untouched (out of scope per prompt — they are sub-screens / overlays).

## Visual spec (summary)

**Page** — `#FFFFFF` background, 16px padding, 16px gap between sections.

**Live / Fleet** — `<SegmentedControl>` (`#F2F2F4` track, white active pill, 13/500 active / 13/400 idle, `#000`/`#6E6E73`).

**Connection card** — white surface, 0.5px `#E5E5EA`, radius 12, padding 14. 40×40 tinted icon (green/neutral/red by state), 10×10 status dot overlay with 2px white border. Title 15/500 -0.2px, eyebrow uppercase device name 11/500 `#6E6E73` 0.3px tracking + 3px bullet + 12px vehicle/driver line.

**Start tracking card** — white card, blue eyebrow "TEST ROUTE", 17/500 title "Begin a lesson or test route", 12px subtitle, then:
- Pupil selector row (`#F2F2F4` fill, 10px radius) — State A (no pupil): 32×32 `#E6F1FB` block + person icon `#2B7BC8`, "No pupil selected" / "Test route mode". State B (selected): 32×32 round avatar with deterministic palette colour + white initial 12/500, pupil's name + lesson type/status. Both states: 12px chevron `#6E6E73`. Tap opens existing picker.
- Primary button: `#2B7BC8` at rest, `#1F2C4A` when `isStarting || isSessionActive` (active recording). White triangle / pause icon, 14/500 white label, label tracks existing logic.
- Secondary button: white, 0.5px `#E5E5EA`, line-style check-circle, "Record official driving test".
- Helper text 11px `#6E6E73` centred, copy switches by selection.

**Dashcam portal card** — white, 0.5px border, radius 12. 32×32 `#F1ECFA` block + camera icon `#8A5BC9`. Title "Dashcam portal" 14/500, subtitle "Review past footage" 11px. Right-side "View footage" link 13/500 `#2B7BC8` + 10px chevron. Whole card tappable (preserves existing route).

**Active-session "Resume" banner** — same white-card spec, dot `#3B8B3B`, Resume button `#1F2C4A` (active recording state).

## Functional improvements

1. **Pupil selector state-aware** — when `selectedPupilId` resolves to a pupil, render avatar + name + (lesson type / "Live lesson" / "Driving test prep" derived from existing `effectiveSessionType`) instead of "No pupil selected". Avatar colour from shared `pupilAvatarColor()` helper.
2. **Primary button colour mirrors recording state** — bind background to `isStarting || isSessionActive`: `#2B7BC8` at rest, `#1F2C4A` only when actively recording. Label & icon already swap via existing logic.
3. **Helper text follows pupil selection** — show "Recording for {name}" when a pupil is selected, "Recording without pupil assignment" when none. (Replaces the existing three-branch text with the simpler two-branch copy the prompt specifies; existing data binding preserved.)

## Removed

Drop-shadows on page-level cards, the navy-gradient toggle pill, dashed dark borders on the secondary button, font-weight 700 titles, ring-glow on the Practice/TestRoute cards (those cards stay functional but adopt the row-spec restraint), and the gradient bar at the bottom of the dashcam / resume cards.

## Out of scope (untouched)

Fullscreen recording view, picker dropdown internals (visual already acceptable; behaviour preserved), `LessonRouteRecorder`, the empty/loading states, `DeviceSelectorDropdown`, `RecentSessionsList`, dashcam destination, official-test dialog. Each is a separate sub-screen per the prompt.
